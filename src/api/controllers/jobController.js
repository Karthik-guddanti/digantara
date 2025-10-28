/**
 * Defensive job controller for /api/jobs
 * - Uses permissive imports (supports named/default).
 * - Catches errors and returns JSON responses to avoid socket hang ups.
 */

import JobService from '../../database/job-service.js';
import * as loggerModule from '../../core/logger.js';

const jobService = JobService;
const logger = loggerModule?.default ?? loggerModule?.logger ?? console;

function logError(message, err) {
  try {
    if (logger && typeof logger.error === 'function') {
      logger.error(message, { error: err && err.stack ? err.stack : err });
    } else {
      console.error(message, err && err.stack ? err.stack : err);
    }
  } catch (_) { /* ignore logger failures */ }
}

function handleError(res, err, message = 'Internal server error', code = 500) {
  logError(message, err);
  if (!res.headersSent) res.status(code).json({ error: message });
}

export async function listJobs(req, res) {
  try {
    const fn = jobService.getAll ?? jobService.list ?? jobService.findAll ?? jobService.find;
    if (typeof fn !== 'function') return res.json({ data: [] });
    const jobs = await fn();
    return res.json({ data: jobs });
  } catch (err) {
    return handleError(res, err, 'Failed to list jobs');
  }
}

export async function getJob(req, res) {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: 'id param required' });
    const fn = jobService.getById ?? jobService.findById ?? jobService.get;
    if (typeof fn !== 'function') return res.status(404).json({ error: 'Not implemented' });
    const job = await fn(id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    return res.json({ data: job });
  } catch (err) {
    return handleError(res, err, 'Failed to get job');
  }
}

export async function createJob(req, res) {
  try {
    const payload = req.body || {};
    const fn = jobService.create ?? jobService.save ?? jobService.insert;
    if (typeof fn !== 'function') return res.status(500).json({ error: 'Create not implemented' });
    if (!payload.name) return res.status(400).json({ error: 'name is required' });
    const created = await fn(payload);
    return res.status(201).json({ data: created });
  } catch (err) {
    return handleError(res, err, 'Failed to create job');
  }
}

export async function updateJob(req, res) {
  try {
    const id = req.params.id;
    const patch = req.body || {};
    if (!id) return res.status(400).json({ error: 'id param required' });
    const fn = jobService.update ?? jobService.updateById ?? jobService.patch;
    if (typeof fn !== 'function') return res.status(500).json({ error: 'Update not implemented' });
    const updated = await fn(id, patch);
    if (!updated) return res.status(404).json({ error: 'Job not found' });
    return res.json({ data: updated });
  } catch (err) {
    return handleError(res, err, 'Failed to update job');
  }
}

export async function deleteJob(req, res) {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: 'id param required' });
    const fn = jobService.remove ?? jobService.delete ?? jobService.deleteById;
    if (typeof fn !== 'function') return res.status(500).json({ error: 'Delete not implemented' });
    const removed = await fn(id);
    if (!removed) return res.status(404).json({ error: 'Job not found' });
    return res.json({ data: removed });
  } catch (err) {
    return handleError(res, err, 'Failed to delete job');
  }
}

const exported = { listJobs, getJob, createJob, updateJob, deleteJob };
export default exported;