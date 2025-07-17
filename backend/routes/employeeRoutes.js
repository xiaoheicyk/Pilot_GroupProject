const express = require('express');
const router = express.Router();
const { submitOnboarding, getProfile } = require('../controllers/employeeController');
const { authMiddleware } = require('../middleware/auth');

router.post('/onboarding', authMiddleware, submitOnboarding);
router.get('/profile/:userId', authMiddleware, getProfile);

module.exports = router;
