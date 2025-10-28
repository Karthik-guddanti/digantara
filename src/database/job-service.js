/**
 * Robust job service adapter (full file) — includes getActiveJobs used by scheduler.
 * Supports job-repository (named/default), Mongoose model, or in-memory fallback.
 */

import * as jobRepositoryModule from './job-repository.js';
import * as jobModelModule from './job-model.js';
import * as loggerModule from '../core/logger.js';

const logger = loggerModule?.default ?? loggerModule?.logger ?? console;
const jobRepository = jobRepositoryModule?.default ? jobRepositoryModule.default : jobRepositoryModule;
const JobModel = jobModelModule?.default ? jobModelModule.default : jobModelModule;

const hasRepo = jobRepository && Object.keys(jobRepository).length > 0;
const hasModel = JobModel && typeof JobModel.find === 'function';

// In-memory fallback store
const inMemory = { items: new Map(), nextId: 1 };

function toPlain(doc) {
  if (!doc) return null;
  if (typeof doc.toObject === 'function') return doc.toObject();
  return doc;
}

export async function getAll() {
  try {
    if (hasRepo && typeof jobRepository.findAll === 'function') return await jobRepository.findAll();
    if (hasRepo && typeof jobRepository.list === 'function') return await jobRepository.list();
    if (hasModel) return typeof JobModel.find().lean === 'function' ? await JobModel.find({}).lean() : await JobModel.find({});
    return Array.from(inMemory.items.values());
  } catch (err) {
    logger?.error?.('jobService.getAll error', err?.stack ?? err);
    throw err;
  }
}

export async function getById(id) {
  try {
    if (hasRepo && typeof jobRepository.findById === 'function') return await jobRepository.findById(id);
    if (hasRepo && typeof jobRepository.get === 'function') return await jobRepository.get(id);
    if (hasModel) return typeof JobModel.findById(id).lean === 'function' ? await JobModel.findById(id).lean() : await JobModel.findById(id);
    return inMemory.items.get(String(id)) || null;
  } catch (err) {
    logger?.error?.('jobService.getById error', { id, err: err?.stack ?? err });
    throw err;
  }
}

export async function create(data = {}) {
  try {
    if (hasRepo && typeof jobRepository.create === 'function') return await jobRepository.create(data);
    if (hasRepo && typeof jobRepository.insert === 'function') return await jobRepository.insert(data);
    if (hasModel && typeof JobModel.create === 'function') {
      const created = await JobModel.create(data);
      return toPlain(created);
    }
    const id = String(inMemory.nextId++);
    const record = { _id: id, ...data, createdAt: new Date(), updatedAt: new Date() };
    inMemory.items.set(id, record);
    return record;
  } catch (err) {
    logger?.error?.('jobService.create error', { data, err: err?.stack ?? err });
    throw err;
  }
}

export async function update(id, patch = {}) {
  try {
    if (hasRepo && typeof jobRepository.updateById === 'function') return await jobRepository.updateById(id, patch);
    if (hasRepo && typeof jobRepository.update === 'function') return await jobRepository.update(id, patch);
    if (hasModel && typeof JobModel.findByIdAndUpdate === 'function') return await JobModel.findByIdAndUpdate(id, { $set: patch }, { new: true, lean: true });
    const key = String(id);
    const existing = inMemory.items.get(key);
    if (!existing) return null;
    const merged = { ...existing, ...patch, updatedAt: new Date() };
    inMemory.items.set(key, merged);
    return merged;
  } catch (err) {
    logger?.error?.('jobService.update error', { id, patch, err: err?.stack ?? err });
    throw err;
  }
}

export async function remove(id) {
  try {
    if (hasRepo && typeof jobRepository.deleteById === 'function') return await jobRepository.deleteById(id);
    if (hasRepo && typeof jobRepository.delete === 'function') return await jobRepository.delete(id);
    if (hasModel && typeof JobModel.findByIdAndDelete === 'function') {
      const res = await JobModel.findByIdAndDelete(id);
      return res ? (typeof res.toObject === 'function' ? res.toObject() : res) : null;
    }
    const key = String(id);
    const existed = inMemory.items.delete(key);
    return existed ? { _id: key } : null;
  } catch (err) {
    logger?.error?.('jobService.remove error', { id, err: err?.stack ?? err });
    throw err;
  }
}

/**
 * Get active jobs for scheduler.
 * - Accepts optional filter object (e.g. { enabled: true } or other fields).
 * - Prefers repository method if provided; otherwise uses model query or in-memory filter.
 */
export async function getActiveJobs(filter = {}) {
  try {
    // repo-level helpers
    if (hasRepo && typeof jobRepository.getActiveJobs === 'function') {
      return await jobRepository.getActiveJobs(filter);
    }
    if (hasRepo && typeof jobRepository.findActive === 'function') {
      return await jobRepository.findActive(filter);
    }

    // model-level query (common shape: enabled:true)
    const q = { ...(filter || {}) };
    if (!('enabled' in q)) q.enabled = true;

    if (hasModel) {
      return typeof JobModel.find().lean === 'function'
        ? await JobModel.find(q).lean()
        : await JobModel.find(q);
    }

    // in-memory fallback: filter stored items
    const arr = Array.from(inMemory.items.values());
    const result = arr.filter((job) => {
      if (typeof q.enabled !== 'undefined' && Boolean(job.enabled) !== Boolean(q.enabled)) return false;
      // support other filter keys: all must match shallowly
      for (const k of Object.keys(q)) {
        if (k === 'enabled') continue;
        if (job[k] === undefined) return false;
        // simple equality check
        if (String(job[k]) !== String(q[k])) return false;
      }
      return true;
    });
    return result;
  } catch (err) {
    logger?.error?.('jobService.getActiveJobs error', { filter, err: err?.stack ?? err });
    throw err;
  }
}

export async function recordExecution(jobId, execInfo = {}) {
  try {
    if (hasRepo && typeof jobRepository.recordExecution === 'function') return await jobRepository.recordExecution(jobId, execInfo);
    if (hasModel && typeof JobModel.findByIdAndUpdate === 'function') {
      return await JobModel.findByIdAndUpdate(
        jobId,
        { $push: { executions: execInfo }, $set: { updatedAt: new Date() } },
        { new: true, lean: true }
      );
    }
    const key = String(jobId);
    const job = inMemory.items.get(key);
    if (!job) return null;
    job.executions = job.executions || [];
    job.executions.push({ ...execInfo, at: new Date() });
    job.updatedAt = new Date();
    inMemory.items.set(key, job);
    return job;
  } catch (err) {
    logger?.error?.('jobService.recordExecution error', { jobId, execInfo, err: err?.stack ?? err });
    throw err;
  }
}

const exported = {
  getAll,
  getById,
  create,
  update,
  remove,
  getActiveJobs,
  recordExecution,
};

export default exported;
