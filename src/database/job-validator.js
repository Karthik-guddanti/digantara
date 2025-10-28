/**
 * Job Validator - Handles job data validation
 * Following SOLID principles - Single Responsibility
 */

import cronParser from 'cron-parser';
import { logger } from '../core/logger.js';

export class JobValidator {
  constructor() {
    this.validJobTypes = ['email', 'data-processing', 'report', 'notification'];
  }

  // Validate job data
  validateJobData(jobData) {
    const errors = [];

    if (!jobData.name || typeof jobData.name !== 'string') {
      errors.push('Job name is required and must be a string');
    }

    if (!jobData.cronSchedule || typeof jobData.cronSchedule !== 'string') {
      errors.push('Cron schedule is required and must be a string');
    }

    if (!jobData.type || typeof jobData.type !== 'string') {
      errors.push('Job type is required and must be a string');
    }

    // Validate cron schedule
    if (jobData.cronSchedule) {
      try {
        cronParser.parseExpression(jobData.cronSchedule);
      } catch (error) {
        errors.push(`Invalid cron schedule: ${error.message}`);
      }
    }

    // Validate job type
    if (jobData.type && !this.validJobTypes.includes(jobData.type)) {
      errors.push(`Invalid job type. Must be one of: ${this.validJobTypes.join(', ')}`);
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }

  // Calculate next run time from cron schedule
  calculateNextRunTime(cronSchedule) {
    try {
      const interval = cronParser.parseExpression(cronSchedule);
      return interval.next().toDate();
    } catch (error) {
      logger.error('Failed to calculate next run time', { 
        cronSchedule, 
        error: error.message 
      });
      throw new Error(`Invalid cron schedule: ${error.message}`);
    }
  }

  // Get valid job types
  getValidJobTypes() {
    return [...this.validJobTypes];
  }
}

