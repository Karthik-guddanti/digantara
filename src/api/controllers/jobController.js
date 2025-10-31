/**
 * Job controller for /api/jobs
 */
import * as loggerModule from '../../core/logger.js';
import { JobValidator } from '../../database/job-validator.js';

// const jobService = JobService; // ❌ REMOVED: We will get this from res.locals
const logger = loggerModule?.default ?? loggerModule?.logger ?? console;
const jobValidator = new JobValidator();

function logError(message, err) {
  try {
    logger.error(message, { error: err && err.stack ? err.stack : err });
  } catch (_) { /* ignore logger failures */ }
}

function handleError(res, err, message = 'Internal server error', code = 500) {
  logError(message, err);
  if (!res.headersSent) res.status(code).json({ error: message });
}

async function listJobs(req, res) {
  try {
    const jobService = res.locals.jobService; // ✅ Get injected service
    const fn = jobService.getAll;
    if (typeof fn !== 'function') return res.json({ data: [] });
    
    // Pass query params to service
    // ✅ Call the method on the correct 'this' context
    const jobs = await fn.call(jobService, req.query); 
    return res.json({ data: jobs });
  } catch (err) {
    return handleError(res, err, 'Failed to list jobs');
  }
}

async function getJob(req, res) {
  try {
    const jobService = res.locals.jobService; // ✅ Get injected service
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: 'id param required' });

    const fn = jobService.getById;
    if (typeof fn !== 'function') return res.status(404).json({ error: 'Not implemented' });

    const job = await fn.call(jobService, id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    return res.json({ data: job });
  } catch (err) {
    return handleError(res, err, 'Failed to get job');
  }
}

async function createJob(req, res) {
  try {
    const payload = req.body || {};
    const jobService = res.locals.jobService; // ✅ Get injected service
    const schedulerManager = res.locals.schedulerService;

    // Validation Block
    try {
      jobValidator.validateJobData(payload);
      // Add nextRun to the payload before creation (using your schema name)
      payload.nextRun = jobValidator.calculateNextRunTime(payload.cronSchedule);
    } catch (validationError) {
      return res.status(400).json({ error: validationError.message });
    }

    const fn = jobService.create;
    if (typeof fn !== 'function') return res.status(500).json({ error: 'Create not implemented' });

    const created = await fn.call(jobService, payload);

    // Tell scheduler to schedule the new job instantly
    if (schedulerManager && typeof schedulerManager.scheduleJob === 'function') {
      schedulerManager.scheduleJob(created);
    }

    return res.status(201).json({ data: created });
  } catch (err) {
    return handleError(res, err, 'Failed to create job');
  }
}

const exported = { listJobs, getJob, createJob };
export default exported;