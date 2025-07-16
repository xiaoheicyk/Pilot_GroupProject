const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { reviewVisa } = require('../controllers/hrController');
const { addHouse, getAllHouses } = require('../controllers/hrController');

router.post('/visa', authMiddleware, reviewVisa);
router.post('/house', authMiddleware, addHouse);
router.get('/house', authMiddleware, getAllHouses);

module.exports = router;
