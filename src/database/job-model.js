/**
 * Job Model - MongoDB Schema
 * This is the corrected version.
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
  },

  // Job type and data
  type: {
    type: String,
    required: true,
    enum: ['email', 'data-processing', 'report', 'notification', 'reminder'],
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

// Pre-save middleware to update timestamps
jobSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to find active jobs
jobSchema.statics.findActiveJobs = function() {
  return this.find({ status: 'active' });
};

// Instance method to mark job as completed
jobSchema.methods.markCompleted = function() {
  // ✅ BUG FIX: A recurring job should stay 'active' after running.
  // We just update its lastRun time.
  this.status = 'active'; 
  this.lastRun = new Date();
  return this.save();
};

// Instance method to mark job as failed
jobSchema.methods.markFailed = function() {
  this.status = 'failed'; // Mark as failed so it can be reviewed
  this.lastRun = new Date();
  return this.save();
};

const Job = mongoose.model('Job', jobSchema);

export default Job;

