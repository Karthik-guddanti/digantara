/**
 * Job Routes - Defines API paths
 * Simplified to only support GET (list/get) and POST (create).
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

// --- Routes ---
router.get('/', listJobs);
router.post('/', createJob);
router.get('/:id', getJob);
// 'updateJob' and 'deleteJob' routes have been removed.

export default router;
