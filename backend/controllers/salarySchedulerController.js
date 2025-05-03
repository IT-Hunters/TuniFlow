const SalaryScheduler = require('../model/SalaryScheduler');
const Wallet = require('../model/wallet');
const Transaction = require('../model/Transaction');

// Create a new salary schedule
exports.createSalarySchedule = async (req, res) => {
  try {
    const { amount, payDay } = req.body;
    const walletId = req.params.walletId;

    const schedule = new SalaryScheduler({
      walletId,
      amount,
      payDay
    });

    await schedule.save();
    res.status(201).json(schedule);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all salary schedules for a wallet
exports.getSalarySchedules = async (req, res) => {
  try {
    const schedules = await SalaryScheduler.find({ walletId: req.params.walletId });
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a salary schedule
exports.deleteSalarySchedule = async (req, res) => {
  try {
    const schedule = await SalaryScheduler.findByIdAndDelete(req.params.id);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Process salary schedules (to be called by a cron job)
exports.processSalarySchedules = async () => {
  try {
    const today = new Date();
    const currentDay = today.getDate();

    // Find all active schedules for today
    const schedules = await SalaryScheduler.find({
      payDay: currentDay,
      isActive: true,
      $or: [
        { lastProcessed: null },
        { lastProcessed: { $lt: new Date(today.getFullYear(), today.getMonth(), 1) } }
      ]
    }).populate('walletId');

    for (const schedule of schedules) {
      try {
        // Get current wallet balance
        const wallet = await Wallet.findById(schedule.walletId);
        if (!wallet) {
          console.error(`Wallet not found for schedule ${schedule._id}`);
          continue;
        }

        // Calculate new balance
        const newBalance = wallet.balance + schedule.amount;

        // Create deposit transaction
        const transaction = new Transaction({
          wallet_id: schedule.walletId,
          amount: schedule.amount,
          type: 'income',
          description: 'Monthly Salary Deposit',
          status: 'completed',
          balanceAfterTransaction: newBalance
        });

        await transaction.save();

        // Update wallet balance
        await Wallet.findByIdAndUpdate(schedule.walletId, {
          $inc: { balance: schedule.amount }
        });

        // Update last processed date
        schedule.lastProcessed = today;
        await schedule.save();

        // Emit salary notification
        if (global.io) {
          global.io.to(wallet.userId.toString()).emit('salaryAdded', {
            amount: schedule.amount,
            date: today,
            walletId: wallet._id
          });
        }

        console.log(`Successfully processed salary schedule ${schedule._id}`);
      } catch (error) {
        console.error(`Error processing schedule ${schedule._id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error processing salary schedules:', error);
  }
}; 