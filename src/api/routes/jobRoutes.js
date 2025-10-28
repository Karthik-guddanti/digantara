/**
 * Job Routes - Defines API paths
 * Following SOLID principles - Single Responsibility
 */

import express from 'express';
import * as controllerModule from '../controllers/jobController.js';

const router = express.Router();

// Support both default and named exports from controller
const controller = controllerModule?.default ?? controllerModule;

// Ensure handler functions exist and provide safe fallbacks
const listJobs = typeof controller.listJobs === 'function'
  ? controller.listJobs
  : (req, res) => res.status(501).json({ error: 'listJobs not implemented' });

const getJob = typeof controller.getJob === 'function'
  ? controller.getJob
  : (req, res) => res.status(501).json({ error: 'getJob not implemented' });

const createJob = typeof controller.createJob === 'function'
  ? controller.createJob
  : (req, res) => res.status(501).json({ error: 'createJob not implemented' });

const updateJob = typeof controller.updateJob === 'function'
  ? controller.updateJob
  : (req, res) => res.status(501).json({ error: 'updateJob not implemented' });

const deleteJob = typeof controller.deleteJob === 'function'
  ? controller.deleteJob
  : (req, res) => res.status(501).json({ error: 'deleteJob not implemented' });

// Routes
router.get('/', listJobs);
router.post('/', createJob);
router.get('/:id', getJob);
router.put('/:id', updateJob);
router.delete('/:id', deleteJob);

export default router;
