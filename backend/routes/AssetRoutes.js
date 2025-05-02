const express = require('express');
const router = express.Router();
const AssetsCalculationController = require('../controllers/AssetsCalculationController');
const { authenticateJWT } = require('../config/autorisation');
router.get('/:userId',authenticateJWT, AssetsCalculationController.calculateWorkingCapital);
router.get('/WorkingCapitalStatus/:userId', authenticateJWT,AssetsCalculationController.calculateWorkingCapitalStatus);

module.exports = router;