const Wallet = require("../model/wallet");
const Transaction = require("../model/Transaction");
const mongoose = require("mongoose");
// 📌 Effectuer un dépôt (Deposit)
exports.deposit = async (req, res, io) => {
  try {
    const { walletId } = req.params;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Le montant doit être supérieur à 0" });
    }

    const wallet = await Wallet.findById(walletId);
    if (!wallet) {
      return res.status(404).json({ message: "Wallet introuvable" });
    }

    const transactions = await Transaction.find({ wallet_id: walletId });
    const balance = transactions.reduce((acc, t) => acc + (t.type === "income" ? t.amount : -t.amount), 0);

    const transaction = new Transaction({
      wallet_id: walletId,
      amount: amount,
      type: "income",
      balanceAfterTransaction: balance + amount,
      date: req.body.date
    });

    await transaction.save();

    // 🔹 Mise à jour du solde dans le wallet
    wallet.balance += amount;
    await wallet.save();

    global.io.emit("transactionUpdate", { walletId, balance: wallet.balance, transaction });
    res.status(200).json({ message: "Dépôt effectué avec succès", transaction, newBalance: wallet.balance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 📌 Effectuer un retrait (Withdraw)
exports.withdraw = async (req, res) => {
  try {
    const { walletId } = req.params;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Le montant doit être supérieur à 0" });
    }

    const wallet = await Wallet.findById(walletId);
    if (!wallet) {
      return res.status(404).json({ message: "Wallet introuvable" });
    }

    const transactions = await Transaction.find({ wallet_id: walletId });
    const balance = transactions.reduce((acc, t) => acc + (t.type === "income" ? t.amount : -t.amount), 0);

    if (balance < amount) {
      return res.status(400).json({ message: "Fonds insuffisants" });
    }

    const transaction = new Transaction({
      wallet_id: walletId,
      amount: amount,
      type: "expense",
      balanceAfterTransaction: balance - amount
    });

    await transaction.save();

    // 🔹 Mise à jour du solde dans le wallet
    wallet.balance -= amount;
    await wallet.save();

    global.io.emit("transactionUpdate", { walletId, balance: wallet.balance, transaction });
    res.status(200).json({ message: "Retrait effectué avec succès", transaction, newBalance: wallet.balance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 📌 Obtenir le solde d'un wallet
exports.getBalance = async (req, res) => {
  try {
    const { walletId } = req.params;
    const wallet = await Wallet.findById(walletId);
    
    if (!wallet) {
      return res.status(404).json({ message: "Wallet introuvable" });
    }

    // Calcul du solde basé sur les transactions
    const transactions = await Transaction.find({ wallet_id: walletId });
    const balance = transactions.reduce((acc, t) => acc + (t.type === "income" ? t.amount : -t.amount), 0);

    res.status(200).json({ walletId, balance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const { walletId } = req.params;
    const { type, status, startDate, endDate } = req.query;

    const filters = { wallet_id: walletId };

    if (type) filters.type = type;
    if (status) filters.status = status;
    if (startDate || endDate) {
      filters.date = {};
      if (startDate) filters.date.$gte = new Date(startDate);
      if (endDate) filters.date.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(filters).sort({ date: -1 });

    res.status(200).json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.cancelTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction introuvable" });
    }

    if (transaction.status !== "pending") {
      return res.status(400).json({ message: "Seules les transactions en attente peuvent être annulées" });
    }

    // Mettre à jour la transaction
    transaction.status = "canceled";
    await transaction.save();

    // Si c'était un dépôt, retirer le montant du wallet
    if (transaction.type === "income") {
      const wallet = await Wallet.findById(transaction.wallet_id);
      if (wallet) {
        wallet.balance -= transaction.amount;
        await wallet.save();
      }
    }

    res.status(200).json({ message: "Transaction annulée avec succès", transaction });
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
      return res.status(404).json({ message: "Transaction introuvable" });
    }

    if (transaction.status !== "pending") {
      return res.status(400).json({ message: "Seules les transactions en attente peuvent être modifiées" });
    }

    if (amount && amount <= 0) {
      return res.status(400).json({ message: "Le montant doit être supérieur à 0" });
    }

    // Mise à jour des champs
    if (amount) transaction.amount = amount;
    if (description) transaction.description = description;

    await transaction.save();
    res.status(200).json({ message: "Transaction mise à jour avec succès", transaction });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.transfer = async (req, res) => {
  try {
    const { senderWalletId, receiverWalletId } = req.params;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Le montant doit être supérieur à 0" });
    }

    const senderWallet = await Wallet.findById(senderWalletId);
    const receiverWallet = await Wallet.findById(receiverWalletId);

    if (!senderWallet || !receiverWallet) {
      return res.status(404).json({ message: "L'un des wallets est introuvable" });
    }

    if (senderWallet.balance < amount) {
      return res.status(400).json({ message: "Fonds insuffisants" });
    }

    // Calcul des nouveaux soldes
    const newSenderBalance = senderWallet.balance - amount;
    const newReceiverBalance = receiverWallet.balance + amount;

    // Créer la transaction de retrait pour l'expéditeur
    const senderTransaction = new Transaction({
      wallet_id: senderWalletId,
      amount: amount,
      type: "expense",
      balanceAfterTransaction: newSenderBalance,
    });

    // Créer la transaction de dépôt pour le destinataire
    const receiverTransaction = new Transaction({
      wallet_id: receiverWalletId,
      amount: amount,
      type: "income",
      balanceAfterTransaction: newReceiverBalance,
    });

    await senderTransaction.save();
    await receiverTransaction.save();

    // Mettre à jour les soldes des wallets
    senderWallet.balance = newSenderBalance;
    receiverWallet.balance = newReceiverBalance;

    await senderWallet.save();
    await receiverWallet.save();

    res.status(200).json({
      message: "Transfert effectué avec succès",
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
    const { walletId } = req.params;

    // Fetch all income transactions for the given wallet
    const transactions = await Transaction.find({ wallet_id: walletId, type: "income" });

    // Calculate total revenue by summing the amounts of all income transactions
    const totalRevenue = transactions.reduce((acc, t) => acc + t.amount, 0);

    // Calculate the change in revenue
    const previousWeekRevenue = await getPreviousWeekRevenue(walletId);
    const revenueChange = totalRevenue - previousWeekRevenue;

    res.status(200).json({
      totalRevenue,
      revenueChange,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Helper function to fetch the previous week's revenue
async function getPreviousWeekRevenue(walletId) {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const previousWeekTransactions = await Transaction.find({
    wallet_id: walletId,
    type: "income",
    date: { $gte: oneWeekAgo }
  });

  return previousWeekTransactions.reduce((acc, t) => acc + t.amount, 0);
}

exports.getExpenses = async (req, res) => {
  try {
    const { walletId } = req.params;
    const { period } = req.query;
    const objectId = new mongoose.Types.ObjectId(walletId);

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
          wallet_id: objectId, // Changed from walletId to wallet_id to match schema
          type: 'expense', // Changed from transactionType to type to match your schema
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$amount' }
        }
      }
    ]);

    const totalExpenses = expenses.length > 0 ? expenses[0].totalExpenses : 0;

    res.status(200).json({ totalExpenses });
  } catch (error) {
    console.error("Error calculating expenses:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
