const express = require('express');
const router = express.Router();
const AssetsCalculationController = require('../controllers/AssetsCalculationController');
const { authenticateJWT } = require('../config/autorisation');
router.get('/:id',authenticateJWT, AssetsCalculationController.calculateWorkingCapital);
router.get('/WorkingCapitalStatus/:id', AssetsCalculationController.calculateWorkingCapitalStatus);

module.exports = router;