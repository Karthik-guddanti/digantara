/**
 * Job Validator - Ensures job data is valid
 */

import cronParser from 'cron-parser';
import { logger } from '../core/logger.js';

export class JobValidator {
  /**
   * Validates the structure and content of job data.
   * @param {object} jobData - The job payload to validate.
   * @throws {Error} If validation fails.
   */
  validateJobData(jobData) {
    if (!jobData) {
      throw new Error('Job data cannot be empty.');
    }

    // Basic required fields (using your schema names)
    if (!jobData.name || typeof jobData.name !== 'string' || jobData.name.trim() === '') {
      throw new Error('Job name is required and must be a non-empty string.');
    }
    if (!jobData.cronSchedule || typeof jobData.cronSchedule !== 'string' || jobData.cronSchedule.trim() === '') {
      throw new Error('Cron schedule is required and must be a non-empty string.');
    }
    if (!jobData.type || typeof jobData.type !== 'string' || jobData.type.trim() === '') {
      throw new Error('Job type is required and must be a non-empty string.');
    }

    // Validate cron schedule format
    this.validateCronSchedule(jobData.cronSchedule);

    // Optional: Add more specific validation for 'type' and 'data'
    if (jobData.type === 'email' && (!jobData.data || !jobData.data.to || !jobData.data.subject)) {
      logger.warn('Email job type without "data.to" or "data.subject" might be incomplete.', { jobName: jobData.name });
    }
    // Ensure status is valid if provided
    if (jobData.status && !['active', 'paused', 'completed', 'failed'].includes(jobData.status)) {
        throw new Error('Invalid job status. Must be "active", "paused", "completed", or "failed".');
    }
  }

  /**
   * Validates a cron schedule string.
   * @param {string} cronSchedule - The cron string to validate.
   * @throws {Error} If the cron schedule is invalid.
   */
  validateCronSchedule(cronSchedule) {
    if (!cronSchedule || typeof cronSchedule !== 'string') {
      throw new Error('Cron schedule must be a non-empty string.');
    }
    try {
      // ✅ FIXED: 'seconds' is now a top-level option
      const options = {
        currentDate: new Date(),
        // Set seconds: true if the cron string has 6 fields
        seconds: cronSchedule.split(' ').length === 6
      };
      
      cronParser.parseExpression(cronSchedule, options);
    } catch (error) {
      throw new Error(`Invalid cron schedule format: "${cronSchedule}". Error: ${error.message}`);
    }
  }

  /**
   * Calculates the next run time for a given cron schedule.
   * @param {string} cronSchedule - The cron string.
   * @returns {Date} The next calculated run time.
   * @throws {Error} If the cron schedule is invalid.
   */
  calculateNextRunTime(cronSchedule) {
    try {
      // ✅ FIXED: 'seconds' is now a top-level option
      const options = {
        currentDate: new Date(),
        seconds: cronSchedule.split(' ').length === 6
      };
      
      const interval = cronParser.parseExpression(cronSchedule, options);
      return interval.next().toDate();
    } catch (error) {
      logger.error('Failed to calculate next run time', { cronSchedule, error: error.message });
      throw new Error(`Failed to calculate next run time for cron schedule "${cronSchedule}". Error: ${error.message}`);
    }
  }
}