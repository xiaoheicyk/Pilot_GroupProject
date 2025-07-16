const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadOptDocument } = require('../controllers/optController');
const { getOptStatus } = require('../controllers/optController');

router.get('/', authMiddleware, getOptStatus);
router.post('/', authMiddleware, upload.single('file'), uploadOptDocument);

module.exports = router;
