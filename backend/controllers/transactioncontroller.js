const Wallet = require("../model/wallet");
const User = require("../model/user");
const Project = require("../model/Project");
const Transaction = require("../model/Transaction");
const mongoose = require("mongoose");


exports.deposit = async (req, res, io) => {
  try {
    const { walletId } = req.params;
    const { amount, is_taxable = false, vat_rate = 0 } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "The amount must be greater than 0" });
    }

    const wallet = await Wallet.findById(walletId);
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    const transactions = await Transaction.find({ wallet_id: walletId });
    const balance = transactions.reduce((acc, t) => acc + (t.type === "income" ? t.amount : -t.amount), 0);

    const transaction = new Transaction({
      wallet_id: walletId,
      amount,
      type: "income",
      balanceAfterTransaction: balance + amount,
      date: req.body.date || Date.now(),
      is_taxable,
      vat_rate,
    });

    await transaction.save();

    wallet.balance += amount;
    await wallet.save();

    global.io.emit("transactionUpdate", { walletId, balance: wallet.balance, transaction });
    res.status(200).json({ message: "Deposit completed successfully", transaction, newBalance: wallet.balance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.withdraw = async (req, res, io) => {
  try {
    const { walletId } = req.params;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "The amount must be greater than 0" });
    }

    const wallet = await Wallet.findById(walletId);
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    if (wallet.balance < amount) {
      return res.status(400).json({ message: "Insufficient funds" });
    }

    const transactions = await Transaction.find({ wallet_id: walletId });
    const balance = transactions.reduce((acc, t) => acc + (t.type === "income" ? t.amount : -t.amount), 0);

    const transaction = new Transaction({
      wallet_id: walletId,
      amount,
      type: "expense",
      balanceAfterTransaction: balance - amount,
      date: req.body.date || Date.now(),
    });

    await transaction.save();

    wallet.balance -= amount;
    await wallet.save();

    global.io.emit("transactionUpdate", { walletId, balance: wallet.balance, transaction });
    res.status(200).json({ message: "Withdrawal completed successfully", transaction, newBalance: wallet.balance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.transfer = async (req, res) => {
  try {
    const { senderWalletId, receiverWalletId } = req.params;
    const { amount, is_taxable = false, vat_rate = 0 } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "The amount must be greater than 0" });
    }

    const senderWallet = await Wallet.findById(senderWalletId);
    const receiverWallet = await Wallet.findById(receiverWalletId);

    if (!senderWallet || !receiverWallet) {
      return res.status(404).json({ message: "One of the wallets was not found" });
    }

    if (senderWallet.balance < amount) {
      return res.status(400).json({ message: "Insufficient funds" });
    }

    const newSenderBalance = senderWallet.balance - amount;
    const newReceiverBalance = receiverWallet.balance + amount;

    const senderTransaction = new Transaction({
      wallet_id: senderWalletId,
      amount: amount,
      type: "expense",
      balanceAfterTransaction: newSenderBalance,
      date: Date.now(),
    });

    const receiverTransaction = new Transaction({
      wallet_id: receiverWalletId,
      amount: amount,
      type: "income",
      balanceAfterTransaction: newReceiverBalance,
      date: Date.now(),
      is_taxable,
      vat_rate,
    });

    await senderTransaction.save();
    await receiverTransaction.save();

    senderWallet.balance = newSenderBalance;
    receiverWallet.balance = newReceiverBalance;

    await senderWallet.save();
    await receiverWallet.save();

    res.status(200).json({
      message: "Transfer completed successfully",
      senderTransaction,
      receiverTransaction,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const { walletId } = req.params;
    const transactions = await Transaction.find({ wallet_id: walletId });
    res.status(200).json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 📌 Get the balance of a wallet
exports.getBalance = async (req, res) => {
  try {
    const { walletId } = req.params;
    const wallet = await Wallet.findById(walletId);
    
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    // Calculate the balance based on transactions
    const transactions = await Transaction.find({ wallet_id: walletId });
    const balance = transactions.reduce((acc, t) => acc + (t.type === "income" ? t.amount : -t.amount), 0);

    res.status(200).json({ walletId, balance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



exports.cancelTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    if (transaction.status !== "pending") {
      return res.status(400).json({ message: "Only pending transactions can be canceled" });
    }

    // Update the transaction
    transaction.status = "canceled";
    await transaction.save();

    // If it was a deposit, subtract the amount from the wallet
    if (transaction.type === "income") {
      const wallet = await Wallet.findById(transaction.wallet_id);
      if (wallet) {
        wallet.balance -= transaction.amount;
        await wallet.save();
      }
    }

    res.status(200).json({ message: "Transaction canceled successfully", transaction });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { amount, description } = req.body;

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    if (transaction.status !== "pending") {
      return res.status(400).json({ message: "Only pending transactions can be modified" });
    }

    if (amount && amount <= 0) {
      return res.status(400).json({ message: "The amount must be greater than 0" });
    }

    // Update the fields
    if (amount) transaction.amount = amount;
    if (description) transaction.description = description;

    await transaction.save();
    res.status(200).json({ message: "Transaction updated successfully", transaction });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.transfer = async (req, res) => {
  try {
    const { senderWalletId, receiverWalletId } = req.params;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "The amount must be greater than 0" });
    }

    const senderWallet = await Wallet.findById(senderWalletId);
    const receiverWallet = await Wallet.findById(receiverWalletId);

    if (!senderWallet || !receiverWallet) {
      return res.status(404).json({ message: "One of the wallets was not found" });
    }

    if (senderWallet.balance < amount) {
      return res.status(400).json({ message: "Insufficient funds" });
    }

    // Calculate new balances
    const newSenderBalance = senderWallet.balance - amount;
    const newReceiverBalance = receiverWallet.balance + amount;

    // Create the withdrawal transaction for the sender
    const senderTransaction = new Transaction({
      wallet_id: senderWalletId,
      amount: amount,
      type: "expense",
      balanceAfterTransaction: newSenderBalance,
    });

    // Create the deposit transaction for the receiver
    const receiverTransaction = new Transaction({
      wallet_id: receiverWalletId,
      amount: amount,
      type: "income",
      balanceAfterTransaction: newReceiverBalance,
    });

    await senderTransaction.save();
    await receiverTransaction.save();

    // Update the wallet balances
    senderWallet.balance = newSenderBalance;
    receiverWallet.balance = newReceiverBalance;

    await senderWallet.save();
    await receiverWallet.save();

    res.status(200).json({
      message: "Transfer completed successfully",
      senderTransaction,
      receiverTransaction
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 📌 Get the total revenue (income transactions)
exports.getRevenue = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Validate projectId
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: "Invalid projectId" });
    }

    // Fetch the project and its wallet
    const project = await Project.findById(projectId).select("wallet");
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    console.log("Project retrieved:", project);

    if (!project.wallet) {
      return res.status(404).json({ message: "No wallet associated with this project" });
    }
    const walletId = project.wallet;
    console.log("Wallet ID:", walletId);

    // Fetch all income transactions for the wallet
    const transactions = await Transaction.find({
      wallet_id: new mongoose.Types.ObjectId(walletId),
      type: "income",
    });

    // Calculate total revenue
    const totalRevenue = transactions.reduce((acc, t) => acc + t.amount, 0);

    // Calculate the change in revenue
    const previousWeekRevenue = await getPreviousWeekRevenue([walletId]);
    const revenueChange = totalRevenue - previousWeekRevenue;

    res.status(200).json({
      totalRevenue,
      revenueChange,
    });
  } catch (error) {
    console.error("Error calculating revenue:", error.stack);
    res.status(500).json({ message: "Failed to calculate revenue", error: error.message });
  }
};

// 📌 Helper function to fetch the previous week's revenue
const getPreviousWeekRevenue = async (walletIds) => {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 14);
  const endDate = new Date(today);
  endDate.setDate(today.getDate() - 7);

  const transactions = await Transaction.find({
    wallet_id: { $in: walletIds.map(id => new mongoose.Types.ObjectId(id)) },
    type: "income",
    date: { $gte: startDate, $lte: endDate },
  });

  return transactions.reduce((acc, t) => acc + t.amount, 0);
};
const getUserWalletIds = async (userId) => {
  const user = await User.findById(userId).select("role project projects");
  if (!user) {
    throw new Error("User not found");
  }

  let projectIds = [];
  if (user.role === "BUSINESS_MANAGER") {
    if (user.project) {
      projectIds = [user.project];
    }
  } else if (user.role === "BUSINESS_OWNER") {
    projectIds = user.projects || [];
  } else {
    throw new Error("Unauthorized role for accessing project wallets");
  }

  if (projectIds.length === 0) {
    throw new Error("No projects found for this user");
  }

  // Fetch wallets for the projects
  const projects = await Project.find({ _id: { $in: projectIds } }).select("wallet");
  const walletIds = projects
    .filter((project) => project.wallet)
    .map((project) => project.wallet);

  if (walletIds.length === 0) {
    throw new Error("No wallets found for the user's projects");
  }

  return walletIds;
};

exports.getExpenses = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { period } = req.query;

    // Validate projectId
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: "Invalid projectId" });
    }

    // Fetch the project and its wallet
    const project = await Project.findById(projectId).select("wallet");
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    console.log("Project retrieved:", project);

    if (!project.wallet) {
      return res.status(404).json({ message: "No wallet associated with this project" });
    }
    const walletId = project.wallet;
    console.log("Wallet ID:", walletId);

    const today = new Date();
    let startDate, endDate;

    if (period === 'current') {
      // Last 7 days
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);
      endDate = today;
    } else if (period === 'previous') {
      // Previous 7 days before last week
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 14);
      endDate = new Date(today);
      endDate.setDate(today.getDate() - 7);
    } else {
      return res.status(400).json({ message: "Invalid period parameter. Use 'current' or 'previous'" });
    }

    const expenses = await Transaction.aggregate([
      {
        $match: {
          wallet_id: new mongoose.Types.ObjectId(walletId),
          type: 'expense',
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$amount' },
        },
      },
    ]);

    const totalExpenses = expenses.length > 0 ? expenses[0].totalExpenses : 0;

    res.status(200).json({ totalExpenses });
  } catch (error) {
    console.error("Error calculating expenses:", error.stack);
    res.status(500).json({ message: "Failed to calculate expenses", error: error.message });
  }
};

exports.getTransactionByWalletId = async (req, res) => {
  try {
    const { walletId } = req.params;

    const transaction = await Transaction.find({
      wallet_id: walletId
    });

    if (!transaction) {
      return res.status(404).json({ 
        message: "Transaction not found for this wallet" 
      });
    }

    res.status(200).json({
      message: "Transaction retrieved successfully",
      data: transaction
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};