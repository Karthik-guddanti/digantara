/**
 * Scheduler Manager - Main scheduler coordination
 */

import cron from 'node-cron';
import cronParser from 'cron-parser';
import { JobExecutor } from './job-executor.js';
import { JobDiscovery } from './job-discovery.js';
import { logger } from '../core/logger.js';

export class SchedulerManager {
  constructor(jobService) {
    this.jobService = jobService;
    this.scheduledTasks = new Map();
    this.isShuttingDown = false;
    this.instanceId = `scheduler-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Initialize sub-modules
    this.jobExecutor = new JobExecutor(jobService); // Pass the service instance
    this.jobDiscovery = new JobDiscovery(jobService, this);
  }

  // Start the scheduler
  async start() {
    logger.info('Starting job scheduler', { instanceId: this.instanceId });
    
    try {
      // Load and schedule all active jobs
      const activeJobs = await this.jobService.getActiveJobs();
      
      logger.info('Loading Active Jobs...', { 
        count: activeJobs.length,
        instanceId: this.instanceId 
      });
      
      activeJobs.forEach(job => {
        this.scheduleJob(job);
      });
      
      // Start periodic job discovery
      this.jobDiscovery.start();
      
      logger.info('Job scheduler started successfully', { 
        instanceId: this.instanceId,
        scheduledJobs: this.scheduledTasks.size,
        discoveryInterval: this.jobDiscovery.discoveryInterval
      });
    } catch (error) {
      logger.error('Failed to start scheduler', { 
        error: error.message,
        instanceId: this.instanceId 
      });
      throw error;
    }
  }

  // Schedule a single job
  scheduleJob(job) {
    if (this.isShuttingDown) {
      logger.warn('Scheduler is shutting down, skipping job scheduling', { 
        jobId: job._id 
      });
      return;
    }

    // Stop existing task if it exists
    this.unscheduleJob(job._id.toString());

    if (job.status !== 'active') {
      logger.info('Job is not active, skipping scheduling', { 
        jobId: job._id, 
        name: job.name, 
        status: job.status 
      });
      return;
    }

    try {
      // Validate cron expression
      const options = { seconds: job.cronSchedule.split(' ').length === 6 };
      const interval = cronParser.parseExpression(job.cronSchedule, options);
      const nextRunTime = interval.next().toDate();
      
      const task = cron.schedule(job.cronSchedule, async () => {
        if (this.isShuttingDown) {
          logger.warn('Scheduler is shutting down, skipping job execution', { 
            jobId: job._id 
          });
          return;
        }
        // ✅ FIXED: Correctly call execute with only the job object
        await this.jobExecutor.execute(job);
      }, {
        scheduled: true,
        timezone: process.env.TZ || 'UTC'
      });

      this.scheduledTasks.set(job._id.toString(), task);
      
      logger.info(`JOB SCHEDULED: "${job.name}"`, { 
        jobId: job._id, 
        jobType: job.type,
        schedule: job.cronSchedule,
        nextRun: nextRunTime.toLocaleString()
      });
    } catch (error) {
      logger.error(`FAILED TO SCHEDULE JOB: "${job.name}"`, { 
        jobId: job._id, 
        error: error.message 
      });
    }
  }

  // Unschedule a job
  unscheduleJob(jobId) {
    const taskId = jobId.toString();
    if (this.scheduledTasks.has(taskId)) {
      this.scheduledTasks.get(taskId).stop();
      this.scheduledTasks.delete(taskId);
      logger.info('Job unscheduled successfully', { jobId });
    }
  }

  // Stop scheduler
  stop() {
    logger.info('Stopping job scheduler', { instanceId: this.instanceId });
    
    this.scheduledTasks.forEach((task, jobId) => {
      task.stop();
      logger.info('Stopped job', { jobId });
    });
    
    this.scheduledTasks.clear();
    logger.info('Job scheduler stopped', { instanceId: this.instanceId });
  }

  // Graceful shutdown
  async shutdown() {
    logger.info('Initiating scheduler shutdown', { instanceId: this.instanceId });
    this.isShuttingDown = true;
    
    this.jobDiscovery.stop();
    this.stop();
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    logger.info('Scheduler shutdown completed', { instanceId: this.instanceId });
  }

  // Get scheduler status
  getStatus() {
    return {
      instanceId: this.instanceId,
      totalScheduledTasks: this.scheduledTasks.size,
      scheduledJobIds: Array.from(this.scheduledTasks.keys()),
      isShuttingDown: this.isShuttingDown,
      uptime: process.uptime(),
      discovery: this.jobDiscovery.getStatus()
    };
  }

  // Getters for other modules
  getInstanceId() {
    return this.instanceId;
  }

  getScheduledJobIds() {
    return Array.from(this.scheduledTasks.keys());
  }

  getScheduledJobCount() {
    return this.scheduledTasks.size;
  }
}