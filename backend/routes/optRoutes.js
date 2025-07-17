const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { uploadOptDocument } = require('../controllers/optController');
const { getOptStatus } = require('../controllers/optController');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get('/', authMiddleware, getOptStatus);
router.post('/', authMiddleware, upload.single('file'), uploadOptDocument);

module.exports = router;
