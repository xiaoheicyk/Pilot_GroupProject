const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { reviewVisa } = require('../controllers/hrController');

router.post('/visa', authMiddleware, reviewVisa);

module.exports = router;
