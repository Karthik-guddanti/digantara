/**
 * Job Executor - Responsible for executing a single job.
 */

import { logger } from '../core/logger.js';
import { JobValidator } from '../database/job-validator.js';
// import JobService from '../database/job-service.js'; // ❌ REMOVED: We get this via constructor

const jobValidator = new JobValidator();

export class JobExecutor {
  constructor(jobService) {
    // ✅ FIXED: Correctly assign the injected service instance
    if (!jobService) {
      throw new Error('JobExecutor requires a JobService instance.');
    }
    this.jobService = jobService;
  }

  /**
   * Executes a given job.
   * @param {object} job - The job document to execute.
   */
  async execute(job) {
    const jobName = job.name || job._id; // Use your schema field 'name'

    try {
      // --- 1. Run the actual job logic ---
      switch (job.type) { // Use your schema field 'type'
        case 'email':
          await this.sendEmail(job);
          break;
        case 'reminder':
          await this.sendReminder(job);
          break;
        // Add other cases as needed
        default:
          await this.performGenericTask(job);
          break;
      }

      // --- 2. After successful execution, update timestamps ---
      const lastRun = new Date(); // The time right now
      const nextRun = jobValidator.calculateNextRunTime(job.cronSchedule); // Use 'cronSchedule'

      // Update the database
      await this.jobService.markJobCompleted(job._id); 
      await this.jobService.updateNextRun(job._id, nextRun); // This updates 'nextRun'

      logger.info(`Job Executed: ${job.name}`, {
        jobId: job._id,
        lastRun: lastRun.toISOString(),
        nextRun: nextRun.toISOString()
      });

    } catch (error) {
      logger.error(`Job "${jobName}" (ID: ${job._id}) failed to execute: ${error.message}`, {
        error: error.stack
      });
      // Mark job as failed in DB
      await this.jobService.markJobFailed(job._id);
    }
  }

  // --- Simulated Job Type Implementations ---

  async sendEmail(job) {
    logger.info(`Sending email for job "${job.name}"`, { jobId: job._id, data: job.data });
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate work
  }

  async sendReminder(job) {
    const message = job.data?.message || `This is a reminder!`;
    logger.info(`Reminder logic executed for "${job.name}"`, { message, jobId: job._id });
    await new Promise(resolve => setTimeout(resolve, 50)); // Simulate work
  }

  async performGenericTask(job) {
    logger.info(`Performing generic task for job "${job.name}"...`, { jobId: job._id, data: job.data });
    await new Promise(resolve => setTimeout(resolve, 50)); // Simulate work
  }
}