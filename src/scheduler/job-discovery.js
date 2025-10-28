/**
 * Job Discovery - Handles periodic job discovery and scheduling
 * Following SOLID principles - Single Responsibility
 */

import { logger } from '../core/logger.js';

export class JobDiscovery {
  constructor(jobService, schedulerManager) {
    this.jobService = jobService;
    this.schedulerManager = schedulerManager;
    this.discoveryInterval = parseInt(process.env.SCHEDULER_INTERVAL) || 10000;
    this.isRunning = false;
    this.intervalId = null;
  }

  // Start periodic job discovery
  start() {
    if (this.isRunning) {
      logger.warn('Job discovery is already running');
      return;
    }

    this.isRunning = true;
    this.intervalId = setInterval(async () => {
      if (this.schedulerManager.isShuttingDown) {
        return;
      }

      try {
        await this.discoverAndScheduleJobs();
      } catch (error) {
        logger.error('Error during job discovery', { 
          error: error.message,
          instanceId: this.schedulerManager.getInstanceId()
        });
      }
    }, this.discoveryInterval);

    logger.info('Job discovery started', { 
      interval: this.discoveryInterval,
      instanceId: this.schedulerManager.getInstanceId()
    });
  }

  // Stop job discovery
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    logger.info('Job discovery stopped');
  }

  // Discover and schedule new jobs
  async discoverAndScheduleJobs() {
    const activeJobs = await this.jobService.getActiveJobs();
    const currentJobIds = new Set(this.schedulerManager.getScheduledJobIds());
    const activeJobIds = new Set(activeJobs.map(job => job._id.toString()));

    // Schedule new jobs
    const newJobs = activeJobs.filter(job => !currentJobIds.has(job._id.toString()));
    if (newJobs.length > 0) {
      console.log(`🔍 Discovered ${newJobs.length} new job(s):`);
      newJobs.forEach((job, index) => {
        console.log(`   ${index + 1}. ${job.name} (${job.type}) - ${job.cronSchedule}`);
        this.schedulerManager.scheduleJob(job);
      });
    }

    // Unschedule jobs that are no longer active
    const jobsToUnschedule = Array.from(currentJobIds).filter(jobId => !activeJobIds.has(jobId));
    if (jobsToUnschedule.length > 0) {
      console.log(`🗑️  Unschedule ${jobsToUnschedule.length} inactive job(s):`);
      jobsToUnschedule.forEach(jobId => {
        console.log(`   - Job ID: ${jobId}`);
        this.schedulerManager.unscheduleJob(jobId);
      });
    }

    // Log discovery summary
    if (newJobs.length > 0 || jobsToUnschedule.length > 0) {
      logger.info('Job discovery completed', {
        newJobs: newJobs.length,
        unscheduledJobs: jobsToUnschedule.length,
        totalActiveJobs: activeJobs.length,
        totalScheduledJobs: this.schedulerManager.getScheduledJobCount(),
        instanceId: this.schedulerManager.getInstanceId()
      });
    }
  }

  // Get discovery status
  getStatus() {
    return {
      isRunning: this.isRunning,
      discoveryInterval: this.discoveryInterval,
      hasInterval: !!this.intervalId
    };
  }
}

