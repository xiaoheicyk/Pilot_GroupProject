const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { reviewVisa } = require('../controllers/hrController');
const { addHouse, getAllHouses, reviewOnboarding,getProgressStatus,generateRegistrationToken} = require('../controllers/hrController');


router.post('/visa', authMiddleware, reviewVisa);
router.post('/house', authMiddleware, addHouse);
router.get('/house', authMiddleware, getAllHouses);
router.post('/onboarding', authMiddleware, reviewOnboarding);
router.get('/progress', authMiddleware, getProgressStatus);
router.post('/token', authMiddleware, generateRegistrationToken);

module.exports = router;
