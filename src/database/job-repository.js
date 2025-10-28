/**
 * Job Repository - Database Operations
 * Following SOLID principles - Single Responsibility
 */

import Job from './job-model.js';
import { logger } from '../core/logger.js';

export class JobRepository {
  // Create a new job
  async create(jobData) {
    try {
      const job = new Job(jobData);
      const savedJob = await job.save();
      
      console.log('✅ Job Created Successfully!');
      console.log(`   📝 Name: ${savedJob.name}`);
      console.log(`   🆔 ID: ${savedJob._id}`);
      console.log(`   ⏰ Schedule: ${savedJob.cronSchedule}`);
      console.log(`   📊 Type: ${savedJob.type}`);
      console.log(`   📅 Next Run: ${savedJob.nextRun ? new Date(savedJob.nextRun).toLocaleString() : 'Not scheduled'}`);
      
      logger.info('Job created', { jobId: savedJob._id, name: savedJob.name });
      return savedJob;
    } catch (error) {
      console.log('❌ Failed to create job:', error.message);
      logger.error('Failed to create job', { error: error.message });
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

  // Update job
  async update(id, updateData) {
    try {
      const job = await Job.findByIdAndUpdate(
        id, 
        { ...updateData, updatedAt: new Date() }, 
        { new: true }
      );
      
      if (!job) {
        throw new Error('Job not found');
      }
      
      console.log('🔄 Job Updated Successfully!');
      console.log(`   📝 Name: ${job.name}`);
      console.log(`   🆔 ID: ${job._id}`);
      console.log(`   ⏰ Schedule: ${job.cronSchedule}`);
      console.log(`   📊 Status: ${job.status}`);
      
      logger.info('Job updated', { jobId: id, name: job.name });
      return job;
    } catch (error) {
      console.log('❌ Failed to update job:', error.message);
      logger.error('Failed to update job', { id, error: error.message });
      throw error;
    }
  }

  // Delete job
  async delete(id) {
    try {
      const job = await Job.findByIdAndDelete(id);
      if (!job) {
        throw new Error('Job not found');
      }
      
      console.log('🗑️  Job Deleted Successfully!');
      console.log(`   📝 Name: ${job.name}`);
      console.log(`   🆔 ID: ${job._id}`);
      console.log(`   📊 Type: ${job.type}`);
      
      logger.info('Job deleted', { jobId: id, name: job.name });
      return job;
    } catch (error) {
      console.log('❌ Failed to delete job:', error.message);
      logger.error('Failed to delete job', { id, error: error.message });
      throw error;
    }
  }

  // Find active jobs for scheduling
  async findActiveJobs() {
    try {
      const jobs = await Job.findActiveJobs();
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
      
      await job.markCompleted();
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
      
      await job.markFailed();
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
        { nextRun, updatedAt: new Date() },
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
