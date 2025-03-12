const Wallet = require("../model/wallet");
const Transaction = require("../model/Transaction");
const Project = require("../model/Project");
const mongoose = require("mongoose");

// 📌 Obtenir tous les wallets
const getWallets = async (req, res) => {
  try {
    const wallets = await Wallet.find()
      .populate("user_id", "fullname email")
      .populate("project", "status due_date");
    res.json(wallets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 📌 Obtenir un wallet par ID utilisateur
const getWalletByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const wallet = await Wallet.findOne({ user_id: userId })
      .populate("user_id", "fullname email")
      .populate("project", "status due_date");
    if (!wallet) {
      return res.status(404).json({ message: "Aucun wallet trouvé pour cet utilisateur" });
    }
    res.status(200).json(wallet);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 📌 Obtenir un wallet par walletId (Nouveau)
const getWalletById = async (req, res) => {
  try {
    const { walletId } = req.params;
    const wallet = await Wallet.findById(walletId)
      .populate("user_id", "fullname email")
      .populate("project", "status due_date");
    if (!wallet) {
      return res.status(404).json({ message: "Wallet introuvable" });
    }
    res.status(200).json(wallet);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 📌 Ajouter un wallet
const addWallet = async (req, res) => {
  try {
    const { user_id, type, projectId } = req.body;

    if (!user_id || !type) {
      return res.status(400).json({ message: "User ID et Type sont requis" });
    }

    const existingWallet = await Wallet.findOne({ user_id });
    if (existingWallet) {
      return res.status(400).json({ message: "L'utilisateur a déjà un wallet" });
    }

    const walletData = { user_id, balance: 0, currency: "TND", type };

    if (projectId) {
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ message: "Projet introuvable" });
      }
      if (project.wallet) {
        return res.status(400).json({ message: "Ce projet est déjà lié à un wallet" });
      }
      walletData.project = projectId;
    }

    const wallet = new Wallet(walletData);
    await wallet.save();

    if (projectId) {
      await Project.findByIdAndUpdate(projectId, { wallet: wallet._id });
    }

    res.status(201).json({ message: "Wallet créé avec succès", wallet });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 📌 Supprimer un wallet
const deleteWallet = async (req, res) => {
  try {
    const { walletId } = req.params;

    const wallet = await Wallet.findById(walletId);
    if (!wallet) {
      return res.status(404).json({ message: "Wallet introuvable" });
    }

    if (wallet.project) {
      await Project.findByIdAndUpdate(wallet.project, { $unset: { wallet: "" } });
    }

    await Wallet.findByIdAndDelete(walletId);
    res.status(200).json({ message: "Wallet supprimé avec succès" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 📌 Mettre à jour un wallet
const updateWallet = async (req, res) => {
  try {
    const { walletId } = req.params;
    const { balance, type, projectId } = req.body;

    const wallet = await Wallet.findById(walletId);
    if (!wallet) {
      return res.status(404).json({ message: "Wallet introuvable" });
    }

    if (balance !== undefined) wallet.balance = balance;
    if (type) wallet.type = type;

    if (projectId !== undefined) {
      if (projectId === null) {
        if (wallet.project) {
          await Project.findByIdAndUpdate(wallet.project, { $unset: { wallet: "" } });
        }
        wallet.project = undefined;
      } else {
        const project = await Project.findById(projectId);
        if (!project) {
          return res.status(404).json({ message: "Projet introuvable" });
        }
        if (project.wallet && project.wallet.toString() !== walletId) {
          return res.status(400).json({ message: "Ce projet est déjà lié à un autre wallet" });
        }
        wallet.project = projectId;
        await Project.findByIdAndUpdate(projectId, { wallet: walletId });
      }
    }

    await wallet.save();
    res.status(200).json({ message: "Wallet mis à jour avec succès", wallet });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 📌 Obtenir les 5 projets avec les plus gros soldes
const getTopProjects = async (req, res) => {
  try {
    const topProjects = await Project.find()
      .populate("wallet", "balance")
      .populate("businessManager", "name")
      .sort({ "wallet.balance": -1 })
      .limit(5);
    res.json(topProjects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 📌 Données pour graphiques en chandelier
const getCandlestickData = async (req, res) => {
  const { interval = 1 } = req.query;
  const pipeline = [
    {
      $group: {
        _id: {
          year: { $year: "$date" },
          month: { $month: "$date" },
          day: { $dayOfMonth: "$date" },
          hour: { $hour: "$date" },
          minute: { $subtract: [{ $minute: "$date" }, { $mod: [{ $minute: "$date" }, Number(interval)] }] },
        },
        open: { $first: "$amount" },
        close: { $last: "$amount" },
        high: { $max: "$amount" },
        low: { $min: "$amount" },
        startTime: { $first: "$date" },
      },
    },
    { $sort: { "startTime": 1 } },
  ];

  try {
    const data = await Transaction.aggregate(pipeline);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📌 Calcul de l'historique des flux de trésorerie
const calculateCashFlowHistory = async (req, res) => {
  try {
    const { walletId } = req.params;
    const { interval = 1 } = req.query;
    const objectId = new mongoose.Types.ObjectId(walletId);

    const wallet = await Wallet.findById(walletId);
    if (!wallet) {
      return res.status(404).json({ message: "Wallet introuvable" });
    }

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
                { $mod: [{ $second: "$date" }, Number(interval)] },
              ],
            },
          },
          totalIncome: {
            $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] },
          },
          totalExpenses: {
            $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] },
          },
          open: { $first: "$amount" },
          close: { $last: "$amount" },
          high: { $max: "$amount" },
          low: { $min: "$amount" },
          startTime: { $first: "$date" },
        },
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
          low: 1,
        },
      },
      { $sort: { date: 1 } },
    ];

    const cashFlowHistory = await Transaction.aggregate(pipeline);

    if (!cashFlowHistory.length) {
      return res.status(404).json({ message: "Aucune transaction trouvée pour ce wallet" });
    }

    res.status(200).json(cashFlowHistory);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'historique des flux :", error);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

// Exportation des fonctions
module.exports = {
  getWallets,
  getWalletByUser,
  getWalletById, // Ajouté ici
  addWallet,
  deleteWallet,
  updateWallet,
  getCandlestickData,
  calculateCashFlowHistory,
  getTopProjects,
};