const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth');
const competitionController = require('../controllers/competitionController');

// Get all competitions (filterable by status)
router.get('/', authenticate, competitionController.getCompetitions);

// Get a specific competition
router.get('/:competitionId', authenticate, competitionController.getCompetition);

// Join a competition
router.post('/:competitionId/join', authenticate, competitionController.joinCompetition);

// Leave a competition
router.post('/:competitionId/leave', authenticate, competitionController.leaveCompetition);

// Get leaderboard for a competition
router.get('/:competitionId/leaderboard', authenticate, competitionController.getLeaderboard);

// Get user's competitions
router.get('/user/me', authenticate, competitionController.getUserCompetitions);

// Admin routes
// Create a competition
router.post('/', authenticate, isAdmin, competitionController.createCompetition);

// Update a competition
router.put('/:competitionId', authenticate, isAdmin, competitionController.updateCompetition);

// Update competition winners
router.put('/:competitionId/winners', authenticate, isAdmin, competitionController.updateCompetitionWinners);

module.exports = router;