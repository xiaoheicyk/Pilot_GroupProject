const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { getMyHouse } = require('../controllers/houseController');

router.get('/', authMiddleware, getMyHouse);

module.exports = router;
