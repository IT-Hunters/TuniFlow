const cron = require('node-cron');
const salarySchedulerController = require('../controllers/salarySchedulerController');

// Run every day at midnight
cron.schedule('0 0 * * *', () => {
  console.log('Running salary schedule processor...');
  salarySchedulerController.processSalarySchedules();
}); 