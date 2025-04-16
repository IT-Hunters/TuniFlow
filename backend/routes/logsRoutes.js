// routes/logs.js
const express = require('express');
const router = express.Router();
const logController = require('../controllers/LogsController');
const { authenticateJWT } = require('../config/autorisation'); 

// GET logs by projectId
router.get('/project/:projectId', authenticateJWT, logController.getLogsByProject);

module.exports = router;