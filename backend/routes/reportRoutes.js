const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { createReport, getMyReports, addComment } = require('../controllers/reportController');

router.post('/employee/maintenance', authMiddleware, createReport);
router.get('/maintenance', authMiddleware, getMyReports);
router.post('/comment', authMiddleware, addComment);

module.exports = router;
