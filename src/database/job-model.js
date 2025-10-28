/**
 * Job Model - MongoDB Schema
 * Simple job schema for intern level
 */

import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  // Basic job information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255
  },
  
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },

  // Scheduling information
  cronSchedule: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        // Basic cron validation - 5 fields
        const cronFields = v.trim().split(/\s+/);
        return cronFields.length === 5;
      },
      message: 'Invalid cron schedule format (use 5 fields: minute hour day month weekday)'
    }
  },

  // Job type and data
  type: {
    type: String,
    required: true,
    enum: ['email', 'data-processing', 'report', 'notification'],
    default: 'email'
  },

  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Status and timing
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'failed'],
    default: 'active'
  },

  lastRun: {
    type: Date,
    default: null
  },

  nextRun: {
    type: Date,
    default: null
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better performance
jobSchema.index({ status: 1, nextRun: 1 });
jobSchema.index({ name: 1 });

// Virtual for job ID as string
jobSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Pre-save middleware to update timestamps
jobSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to find active jobs
jobSchema.statics.findActiveJobs = function() {
  return this.find({ status: 'active' });
};

// Instance method to mark job as completed (keep it active, just update last run)
jobSchema.methods.markCompleted = function() {
  // Keep status as 'active' so job continues to run on schedule
  this.status = 'active';
  this.lastRun = new Date();
  return this.save();
};

// Instance method to mark job as failed (keep it active, just update last run)
jobSchema.methods.markFailed = function() {
  // Keep status as 'active' so job continues to retry
  this.status = 'active';
  this.lastRun = new Date();
  return this.save();
};

// Instance method to truly complete and stop a job
jobSchema.methods.completeAndStop = function() {
  this.status = 'completed';
  this.lastRun = new Date();
  return this.save();
};

const Job = mongoose.model('Job', jobSchema);

export default Job;
