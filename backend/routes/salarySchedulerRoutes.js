const express = require('express');
const router = express.Router();
const salarySchedulerController = require('../controllers/salarySchedulerController');
const { authenticateJWT } = require('../config/autorisation');

// Create a new salary schedule
router.post('/:walletId', authenticateJWT, salarySchedulerController.createSalarySchedule);

// Get all salary schedules for a wallet
router.get('/:walletId', authenticateJWT, salarySchedulerController.getSalarySchedules);

// Delete a salary schedule
router.delete('/:id', authenticateJWT, salarySchedulerController.deleteSalarySchedule);

module.exports = router; 