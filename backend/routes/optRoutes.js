const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadOptDocument } = require('../controllers/optController');

router.post('/', authMiddleware, upload.single('file'), uploadOptDocument);

module.exports = router;
