/**
 * Job Repository - Database Operations
 */

import Job from './job-model.js';
import { logger } from '../core/logger.js';

export class JobRepository {
  // Create a new job
  async create(jobData) {
    try {
      const job = new Job(jobData);
      const savedJob = await job.save();
      
      logger.info('Job created successfully', {
        jobId: savedJob._id,
        name: savedJob.name,
        schedule: savedJob.cronSchedule,
        type: savedJob.type,
        nextRun: savedJob.nextRun
      });
      return savedJob;
    } catch (error) {
      logger.error('Failed to create job', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  // Find job by ID
  async findById(id) {
    try {
      const job = await Job.findById(id);
      if (!job) {
        throw new Error('Job not found');
      }
      return job;
    } catch (error) {
      logger.error('Failed to find job by ID', { id, error: error.message });
      throw error;
    }
  }

  // Get all jobs with pagination
  async findAll(options = {}) {
    try {
      const { page = 1, limit = 10, status, type } = options;
      const query = {};
      
      if (status) query.status = status;
      if (type) query.type = type;
      
      const jobs = await Job.find(query)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });

      const total = await Job.countDocuments(query);

      return {
        jobs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Failed to find all jobs', { error: error.message });
      throw error;
    }
  }

  // Find active jobs for scheduling
  async findActiveJobs() {
    try {
      const jobs = await Job.findActiveJobs(); // Uses static method from model
      logger.debug('Found active jobs', { count: jobs.length });
      return jobs;
    } catch (error) {
      logger.error('Failed to find active jobs', { error: error.message });
      throw error;
    }
  }

  // Mark job as completed
  async markCompleted(id) {
    try {
      const job = await Job.findById(id);
      if (!job) {
        throw new Error('Job not found');
      }
      
      await job.markCompleted(); // Uses instance method from model
      logger.info('Job marked as completed', { jobId: id, name: job.name });
      return job;
    } catch (error) {
      logger.error('Failed to mark job as completed', { id, error: error.message });
      throw error;
    }
  }

  // Mark job as failed
  async markFailed(id) {
    try {
      const job = await Job.findById(id);
      if (!job) {
        throw new Error('Job not found');
      }
      
      await job.markFailed(); // Uses instance method from model
      logger.info('Job marked as failed', { jobId: id, name: job.name });
      return job;
    } catch (error) {
      logger.error('Failed to mark job as failed', { id, error: error.message });
      throw error;
    }
  }

  // Update next run time
  async updateNextRun(id, nextRun) {
    try {
      const job = await Job.findByIdAndUpdate(
        id,
        { nextRun: nextRun, updatedAt: new Date() }, // Use your schema field 'nextRun'
        { new: true }
      );
      
      if (!job) {
        throw new Error('Job not found');
      }
      
      return job;
    } catch (error) {
      logger.error('Failed to update next run time', { id, error: error.message });
      throw error;
    }
  }
}