const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const sleepController = require('../controllers/sleepController');

// Get sleep data for a specific date
router.get('/data/:date', authenticate, sleepController.getSleepData);

// Get sleep data for a date range
router.get('/data', authenticate, sleepController.getSleepDataRange);

// Sync sleep data from Oura
router.post('/sync', authenticate, sleepController.syncOuraData);

// Add a note to sleep data
router.post('/data/:date/note', authenticate, sleepController.addSleepNote);

// Get sleep summary
router.get('/summary', authenticate, sleepController.getSleepSummary);

module.exports = router;