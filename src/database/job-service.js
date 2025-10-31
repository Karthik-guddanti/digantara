/**
 * Job Service - Core Business Logic
 * Implements Dependency Inversion Principle (DIP).
 * It depends on an abstract repository, not a concrete implementation.
 */
import * as loggerModule from '../core/logger.js';

const logger = loggerModule?.default ?? loggerModule?.logger ?? console;

export class JobService {
  constructor(repository) {
    if (!repository) {
      throw new Error('JobService requires a repository.');
    }
    this.repository = repository;
  }

  async getAll(options = {}) {
    try {
      return await this.repository.findAll(options);
    } catch (err) {
      logger?.error?.('jobService.getAll error', err?.stack ?? err);
      throw err;
    }
  }

  async getById(id) {
    try {
      return await this.repository.findById(id);
    } catch (err) {
      logger?.error?.('jobService.getById error', { id, err: err?.stack ?? err });
      throw err;
    }
  }

  async create(data = {}) {
    try {
      return await this.repository.create(data);
    } catch (err) {
      logger?.error?.('jobService.create error', { data, err: err?.stack ?? err });
      throw err;
    }
  }

  async getActiveJobs(filter = {}) {
    try {
      return await this.repository.findActiveJobs();
    } catch (err) {
      logger?.error?.('jobService.getActiveJobs error', { filter, err: err?.stack ?? err });
      throw err;
    }
  }

  async markJobCompleted(id) {
    try {
      return await this.repository.markCompleted(id);
    } catch (err) {
      logger?.error?.('jobService.markJobCompleted error', { id, err: err?.stack ?? err });
      throw err;
    }
  }

  async markJobFailed(id) {
    try {
      return await this.repository.markFailed(id);
    } catch (err) {
      logger?.error?.('jobService.markJobFailed error', { id, err: err?.stack ?? err });
      throw err;
    }
  }

  async updateNextRun(id, nextRun) {
    try {
      return await this.repository.updateNextRun(id, nextRun);
    } catch (err) {
      logger?.error?.('jobService.updateNextRun error', { id, err: err?.stack ?? err });
      throw err;
    }
  }
}