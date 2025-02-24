const express = require('express');
const router = express.Router();
const AssetsCalculationController = require('../controllers/AssetsCalculationController');

router.get('/:id', AssetsCalculationController.calculateWorkingCapital);

module.exports = router;