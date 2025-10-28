/**
 * Scheduler Manager - Main scheduler coordination
 * Following SOLID principles - Single Responsibility
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
    this.jobExecutor = new JobExecutor(jobService, null);
    this.jobDiscovery = new JobDiscovery(jobService, this);
  }

  // Start the scheduler
  async start() {
    logger.info('Starting job scheduler', { instanceId: this.instanceId });
    
    try {
      // Redis removed; no initialization needed

      // Load and schedule all active jobs
      const activeJobs = await this.jobService.getActiveJobs();
      
      console.log('🔍 Loading Active Jobs...');
      console.log(`   📊 Found: ${activeJobs.length} active jobs`);
      
      if (activeJobs.length > 0) {
        console.log('   📋 Jobs to schedule:');
        activeJobs.forEach((job, index) => {
          console.log(`      ${index + 1}. ${job.name} (${job.type}) - ${job.cronSchedule}`);
        });
      } else {
        console.log('   ℹ️  No active jobs found. Ready to schedule new jobs!');
      }
      
      logger.info('Found active jobs to schedule', { 
        count: activeJobs.length,
        instanceId: this.instanceId 
      });
      
      activeJobs.forEach(job => {
        this.scheduleJob(job);
      });
      
      // Start periodic job discovery
      this.jobDiscovery.start();
      
      console.log('⏰ Job Scheduler Started Successfully!');
      console.log(`   🆔 Instance: ${this.instanceId}`);
      console.log(`   📊 Scheduled Jobs: ${this.scheduledTasks.size}`);
      console.log(`   🔄 Discovery Interval: ${this.jobDiscovery.discoveryInterval}ms`);
      
      logger.info('Job scheduler started successfully', { 
        instanceId: this.instanceId 
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
      const interval = cronParser.parseExpression(job.cronSchedule);
      const now = new Date();
      const nextRun = interval.next();
      
      // Store the next run time
      const nextRunTime = nextRun.toDate();
      
      const task = cron.schedule(job.cronSchedule, async () => {
        if (this.isShuttingDown) {
          logger.warn('Scheduler is shutting down, skipping job execution', { 
            jobId: job._id 
          });
          return;
        }
        await this.jobExecutor.executeJob(job, this.instanceId);
      }, {
        scheduled: true,
        timezone: process.env.TZ || 'UTC'
      });

      this.scheduledTasks.set(job._id.toString(), task);
      
      // Format times for display
      const nextRunFormatted = nextRunTime.toLocaleString();
      
      console.log('\n' + '═'.repeat(60));
      console.log(`⏰ JOB SCHEDULED: "${job.name}"`);
      console.log('═'.repeat(60));
      console.log(`📋 Job ID: ${job._id}`);
      console.log(`📍 Job Type: ${job.type}`);
      console.log(`⏰ Schedule: ${job.cronSchedule}`);
      console.log(`⏭️  Next Run: ${nextRunFormatted}`);
      console.log('═'.repeat(60) + '\n');
      
      logger.info('Job scheduled successfully', { 
        jobId: job._id, 
        name: job.name, 
        schedule: job.cronSchedule,
        nextRun: nextRunFormatted
      });
    } catch (error) {
      console.log('\n' + '═'.repeat(60));
      console.log(`❌ FAILED TO SCHEDULE JOB: "${job.name}"`);
      console.log('═'.repeat(60));
      console.log(`📋 Job ID: ${job._id}`);
      console.log(`❌ Error: ${error.message}`);
      console.log('═'.repeat(60) + '\n');
      
      logger.error('Failed to schedule job', { 
        jobId: job._id, 
        name: job.name, 
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
    
    // Stop job discovery
    this.jobDiscovery.stop();
    
    // Stop all scheduled tasks
    this.stop();
    
    // Wait a bit for any running jobs to complete
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

