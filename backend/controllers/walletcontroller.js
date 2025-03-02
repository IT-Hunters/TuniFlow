const Wallet = require("../model/wallet");
const Transaction = require("../model/Transaction");
const mongoose = require('mongoose');
// 📌 Obtenir tous les wallets
exports.getWallets = async (req, res) => {
  try {
    const wallets = await Wallet.find().populate("user_id", "fullname email");
    res.json(wallets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 📌 Ajouter un wallet
exports.addWallet = async (req, res) => {
    try {
      const { user_id, type } = req.body;
  
      if (!user_id || !type) {
        return res.status(400).json({ message: "User ID et Type sont requis" });
      }
  
      const existingWallet = await Wallet.findOne({ user_id });
      if (existingWallet) {
        return res.status(400).json({ message: "L'utilisateur a déjà un wallet" });
      }
  
      // Création du wallet avec balance forcée à 0
      const wallet = new Wallet({ user_id, balance: 0, currency: "TND", type });
      await wallet.save();
  
      res.status(201).json({ message: "Wallet créé avec succès", wallet });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };

// 📌 Supprimer un wallet
exports.deleteWallet = async (req, res) => {
  try {
    const { walletId } = req.params;

    const wallet = await Wallet.findById(walletId);
    if (!wallet) {
      return res.status(404).json({ message: "Wallet introuvable" });
    }

    await Wallet.findByIdAndDelete(walletId);
    res.status(200).json({ message: "Wallet supprimé avec succès" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.updateWallet = async (req, res) => {
    try {
      const { walletId } = req.params;
      const { balance, type } = req.body;
  
      const wallet = await Wallet.findById(walletId);
      if (!wallet) {
        return res.status(404).json({ message: "Wallet introuvable" });
      }
  
      // Mise à jour des champs si fournis
      if (balance !== undefined) wallet.balance = balance;
      if (type) wallet.type = type;
  
      await wallet.save();
      res.status(200).json({ message: "Wallet mis à jour avec succès", wallet });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };
  //this for stock (transactions) value
  exports.getCandlestickData = async (req, res) => {
    const { interval = 1 } = req.query;
     const pipeline = [
    {
      $group: {
        _id: {
          year: { $year: "$date" },
          month: { $month: "$date" },
          day: { $dayOfMonth: "$date" },
          hour: { $hour: "$date" },
          minute: { $subtract: [{ $minute: "$date" }, { $mod: [{ $minute: "$date" }, Number(interval)] }] }
        },
        open: { $first: "$amount" },
        close: { $last: "$amount" },
        high: { $max: "$amount" },
        low: { $min: "$amount" },
        startTime: { $first: "$date" }
      }
    },
    { $sort: { "startTime": 1 } }
  ];

  try {
    const data = await Transaction.aggregate(pipeline);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.calculateCashFlowHistory = async (req, res) => {
  try {
    const { walletId } = req.params;
    const { interval = 1 } = req.query; // Default interval = 1 second
    const objectId = new mongoose.Types.ObjectId(walletId);

    const pipeline = [
      { $match: { wallet_id: objectId } },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            day: { $dayOfMonth: "$date" },
            hour: { $hour: "$date" },
            minute: { $minute: "$date" },
            second: { 
              $subtract: [
                { $second: "$date" }, 
                { $mod: [{ $second: "$date" }, Number(interval)] } // Grouping by custom interval
              ]
            }
          },
          totalIncome: { 
            $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } 
          },
          totalExpenses: { 
            $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } 
          },
          open: { $first: "$amount" }, 
          close: { $last: "$amount" },
          high: { $max: "$amount" },
          low: { $min: "$amount" },
          startTime: { $first: "$date" }
        }
      },
      {
        $project: {
          _id: 0,
          date: "$startTime",
          totalIncome: 1,
          totalExpenses: 1,
          netCashFlow: { $subtract: ["$totalIncome", "$totalExpenses"] },
          open: 1,
          close: 1,
          high: 1,
          low: 1
        }
      },
      { $sort: { date: 1 } }
    ];

    const cashFlowHistory = await Transaction.aggregate(pipeline);
    
    if (!cashFlowHistory.length) {
      return res.status(404).json({ message: "No transactions found for this wallet." });
    }

    res.status(200).json(cashFlowHistory);
  } catch (error) {
    console.error("Error fetching cash flow history:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
exports.getWalletByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const wallet = await Wallet.findOne({ user_id: userId });
    if (!wallet) {
      return res.status(404).json({ message: "Aucun wallet trouvé" });
    }
    res.status(200).json(wallet);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};