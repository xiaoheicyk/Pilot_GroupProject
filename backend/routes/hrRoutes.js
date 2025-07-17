const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { reviewVisa } = require('../controllers/hrController');
const { 
    addHouse, 
    getAllHouses, 
    reviewOnboarding,
    getProgressStatus,
    generateRegistrationToken,
    assignHouse,
    getAllEmployees,
    getEmployeeById,
    updateEmployeeSection, 
    getEmployeeOpt,
    getAllRegistrationTokens,
    getAllOnboardingApplications
} = require('../controllers/hrController');


router.post('/visa', authMiddleware, reviewVisa);
router.post('/house', authMiddleware, addHouse);
router.get('/house', authMiddleware, getAllHouses);
router.post('/onboarding', authMiddleware, reviewOnboarding);
router.get('/progress', authMiddleware, getProgressStatus);
router.post('/token', authMiddleware, generateRegistrationToken);
router.get('/token', authMiddleware, getAllRegistrationTokens);
router.get('/onboarding', authMiddleware, getAllOnboardingApplications);
router.post('/assign-house', authMiddleware, assignHouse);
router.get('/employees', authMiddleware, getAllEmployees);
router.get('/employees/:id', authMiddleware, getEmployeeById);
router.put('/employees/:id/:section', authMiddleware, updateEmployeeSection);
router.get('/opt/:id', authMiddleware, getEmployeeOpt);

module.exports = router;
