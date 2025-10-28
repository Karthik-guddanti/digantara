/**
 * Job Cache - Handles job caching operations
 * Following SOLID principles - Single Responsibility
 */

import { logger } from '../core/logger.js';

export class JobCache {
  constructor(redisService) {
    this.redisService = redisService;
    this.cacheTTL = 300; // 5 minutes
  }

  // Cache job data
  async cacheJob(job) {
    try {
      if (!this.redisService) return;
      const cacheKey = `job:${job._id}`;
      await this.redisService.set(cacheKey, job, this.cacheTTL);
    } catch (error) {
      logger.warn('Failed to cache job', { 
        jobId: job._id, 
        error: error.message 
      });
    }
  }

  // Get cached job
  async getCachedJob(jobId) {
    try {
      if (!this.redisService) return null;
      const cacheKey = `job:${jobId}`;
      return await this.redisService.get(cacheKey);
    } catch (error) {
      logger.warn('Failed to get cached job', { 
        jobId, 
        error: error.message 
      });
      return null;
    }
  }

  // Remove cached job
  async removeCachedJob(jobId) {
    try {
      if (!this.redisService) return;
      const cacheKey = `job:${jobId}`;
      await this.redisService.delete(cacheKey);
    } catch (error) {
      logger.warn('Failed to remove cached job', { 
        jobId, 
        error: error.message 
      });
    }
  }

  // Invalidate jobs list cache
  async invalidateJobsListCache() {
    try {
      if (!this.redisService) return;
      const commonKeys = [
        'jobs:active',
        'jobs:1:10:all:all',
        'jobs:1:10:active:all',
        'jobs:1:10:paused:all'
      ];
      
      for (const key of commonKeys) {
        await this.redisService.delete(key);
      }
    } catch (error) {
      logger.warn('Failed to invalidate jobs list cache', { 
        error: error.message 
      });
    }
  }

  // Cache jobs list with options
  async cacheJobsList(options, result) {
    try {
      if (!this.redisService) return;
      const { page = 1, limit = 10, status, type } = options;
      const cacheKey = `jobs:${page}:${limit}:${status || 'all'}:${type || 'all'}`;
      await this.redisService.set(cacheKey, result, this.cacheTTL);
    } catch (error) {
      logger.warn('Failed to cache jobs list', { 
        error: error.message 
      });
    }
  }

  // Get cached jobs list
  async getCachedJobsList(options) {
    try {
      if (!this.redisService) return null;
      const { page = 1, limit = 10, status, type } = options;
      const cacheKey = `jobs:${page}:${limit}:${status || 'all'}:${type || 'all'}`;
      return await this.redisService.get(cacheKey);
    } catch (error) {
      logger.warn('Failed to get cached jobs list', { 
        error: error.message 
      });
      return null;
    }
  }
}

