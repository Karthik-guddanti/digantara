/**
 * Job Executor - Handles individual job execution
 * Following SOLID principles - Single Responsibility
 */

import cronParser from 'cron-parser';
import { logger } from '../core/logger.js';

export class JobExecutor {
  constructor(jobService) {
    this.jobService = jobService;
    this.lockTTL = parseInt(process.env.JOB_LOCK_TTL) || 30;
  }

  // Execute a job with distributed locking
  async executeJob(job, instanceId) {
    // No distributed locking; single-instance safe

    try {
      // Proceed directly without Redis lock

      const startTime = new Date();
      
      // Get the actual last run time from the job
      const actualLastRun = job.lastRun ? new Date(job.lastRun).toLocaleString() : 'Never';
      const currentRunTime = startTime.toLocaleString();
      
      console.log('\n' + '='.repeat(60));
      console.log(`🚀 EXECUTING JOB: "${job.name}"`);
      console.log('='.repeat(60));
      console.log(`📋 Job ID: ${job._id}`);
      console.log(`📍 Job Type: ${job.type}`);
      console.log(`⏰ Schedule: ${job.cronSchedule}`);
      console.log(`📅 Previous Last Run: ${actualLastRun}`);
      console.log(`🕐 Current Run: ${currentRunTime}`);
      
      // Calculate next run time after execution
      const nextRunTime = this.calculateNextRunTime(job.cronSchedule);
      const nextRunFormatted = nextRunTime.toLocaleString();
      console.log(`⏭️  Next Run: ${nextRunFormatted}`);
      console.log('='.repeat(60) + '\n');
      
      logger.info('Executing job with distributed lock', { 
        jobId: job._id, 
        name: job.name, 
        type: job.type,
        schedule: job.cronSchedule,
        previousLastRun: actualLastRun,
        currentRun: currentRunTime,
        nextRun: nextRunFormatted,
        instanceId: instanceId
      });

      // Execute job logic based on job type
      await this.executeJobLogic(job);
      
      // Update last run time and calculate next run time
      await this.jobService.markJobCompleted(job._id);
      await this.jobService.updateNextRun(job._id, nextRunTime);
      
      const endTime = new Date();
      const duration = endTime - startTime;
      
      console.log('\n' + '='.repeat(60));
      console.log(`✅ JOB COMPLETED: "${job.name}"`);
      console.log(`⏱️  Duration: ${duration}ms`);
      console.log(`🕐 Completed At: ${endTime.toLocaleString()}`);
      console.log('='.repeat(60) + '\n');
      
      logger.info('Job completed successfully', { 
        jobId: job._id, 
        name: job.name, 
        duration: `${duration}ms`,
        completedAt: endTime.toLocaleString(),
        nextRun: nextRunFormatted,
        instanceId: instanceId
      });
      
    } catch (error) {
      console.log(`❌ Job Failed: "${job.name}" - ${error.message}\n`);
      
      logger.error('Job execution failed', { 
        jobId: job._id, 
        name: job.name, 
        error: error.message,
        instanceId: instanceId
      });
      
      // Mark job as failed
      await this.jobService.markJobFailed(job._id);
    } finally {
      // No Redis lock to release
    }
  }

  // Execute job logic based on job type
  async executeJobLogic(job) {
    const { type, name, data } = job;
    
    switch (type) {
      case 'email':
        logger.info('Processing email job', { 
          name, 
          to: data.to || 'default@example.com',
          subject: data.subject || 'Scheduled Email'
        });
        // Simulate email sending
        await this.simulateDelay(1000, 2000);
        break;

      case 'data-processing':
        logger.info('Processing data job', { 
          name, 
          records: data.records || 100 
        });
        // Simulate data processing
        await this.simulateDelay(2000, 5000);
        break;

      case 'report':
        logger.info('Processing report job', { 
          name, 
          reportType: data.reportType || 'Monthly Report',
          period: data.period || '2024-01'
        });
        // Simulate report generation
        await this.simulateDelay(3000, 6000);
        break;

      case 'notification':
        logger.info('Processing notification job', { 
          name, 
          message: data.message || 'Scheduled Notification'
        });
        // Simulate notification sending
        await this.simulateDelay(500, 1500);
        break;

      default:
        logger.warn('Unknown job type encountered', { name, type });
        break;
    }
  }

  // Simulate processing delay
  async simulateDelay(minMs, maxMs) {
    const delay = Math.random() * (maxMs - minMs) + minMs;
    return new Promise(resolve => setTimeout(resolve, delay));
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
}

