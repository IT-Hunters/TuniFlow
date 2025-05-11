const mongoose = require("mongoose");
const Wallet = require("../model/wallet");
const Transaction = require("../model/Transaction");
const Project = require("../model/Project");
const userModel = require("../model/user");

// 📌 Get all wallets
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

// 📌 Get a wallet by user ID
const getWalletByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }
    const wallet = await Wallet.findOne({ user_id: userId })
      .populate("user_id", "fullname email")
      .populate("project", "status due_date");
    if (!wallet) {
      return res.status(404).json({ message: "No wallet found for this user" });
    }
    res.status(200).json(wallet);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 📌 Get a wallet by walletId
const getWalletById = async (req, res) => {
  try {
    const { walletId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(walletId)) {
      return res.status(400).json({ message: "Invalid walletId" });
    }
    const wallet = await Wallet.findById(walletId)
      .populate("user_id", "fullname email")
      .populate("project", "status due_date");
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }
    res.status(200).json(wallet);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 📌 Add a wallet
const addWallet = async (req, res) => {
  try {
    const { user_id, type, projectId } = req.body;

    if (!user_id || !type) {
      return res.status(400).json({ message: "User ID and type are required" });
    }
    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({ message: "Invalid user_id" });
    }

    const existingWallet = await Wallet.findOne({ user_id });
    if (existingWallet) {
      return res.status(400).json({ message: "The user already has a wallet" });
    }

    const walletData = { user_id, balance: 0, currency: "TND", type };

    if (projectId) {
      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ message: "Invalid projectId" });
      }
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      if (project.wallet) {
        return res.status(400).json({ message: "This project is already linked to a wallet" });
      }
      walletData.project = projectId;
    }

    const wallet = new Wallet(walletData);
    await wallet.save();

    if (projectId) {
      await Project.findByIdAndUpdate(projectId, { wallet: wallet._id });
    }

    res.status(201).json({ message: "Wallet created successfully", wallet });
  } catch (err) {
    console.error("Error adding wallet:", err);
    res.status(500).json({ message: err.message });
  }
};

// 📌 Delete a wallet
const deleteWallet = async (req, res) => {
  try {
    const { walletId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(walletId)) {
      return res.status(400).json({ message: "Invalid walletId" });
    }

    const wallet = await Wallet.findById(walletId);
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    if (wallet.project) {
      await Project.findByIdAndUpdate(wallet.project, { $unset: { wallet: "" } });
    }

    await Wallet.findByIdAndDelete(walletId);
    res.status(200).json({ message: "Wallet deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 📌 Update a wallet
const updateWallet = async (req, res) => {
  try {
    const { walletId } = req.params;
    const { balance, type, projectId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(walletId)) {
      return res.status(400).json({ message: "Invalid walletId" });
    }

    const wallet = await Wallet.findById(walletId);
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
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
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
          return res.status(400).json({ message: "Invalid projectId" });
        }
        const project = await Project.findById(projectId);
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }
        if (project.wallet && project.wallet.toString() !== walletId) {
          return res.status(400).json({ message: "This project is already linked to another wallet" });
        }
        wallet.project = projectId;
        await Project.findByIdAndUpdate(projectId, { wallet: walletId });
      }
    }

    await wallet.save();
    res.status(200).json({ message: "Wallet updated successfully", wallet });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 📌 Get the 5 projects with the highest balances
const getTopProjects = async (req, res) => {
  try {
    const topProjects = await Project.find()
      .populate("wallet", "balance")
      .populate("businessManager", "fullname")
      .limit(5);

    topProjects.forEach((project, index) => {
      console.log(`Project ${index + 1} Wallet:`, project.wallet);
    });

    topProjects.sort((a, b) => (b.wallet?.balance || 0) - (a.wallet?.balance || 0));

    console.log("Top Projects:", JSON.stringify(topProjects, null, 2));
    res.json(topProjects);
  } catch (err) {
    console.error("Error fetching top projects:", err);
    res.status(500).json({ message: err.message });
  }
};

// 📌 Data for candlestick charts
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
    { $sort: { startTime: 1 } },
  ];

  try {
    const data = await Transaction.aggregate(pipeline);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📌 Calculate cash flow history
const calculateCashFlowHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { interval = 1 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }
    const userObjectId = new mongoose.Types.ObjectId(userId);
    console.log("User ID:", userObjectId);

    const user = await userModel.findById(userObjectId).select("project");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    console.log("User retrieved:", { _id: user._id, project: user.project });

    if (!user.project) {
      return res.status(404).json({ message: "No project associated with this user" });
    }

    const project = await Project.findById(user.project).select("wallet");
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    console.log("Project retrieved:", project);

    if (!project.wallet) {
      return res.status(404).json({ message: "No wallet associated with this project" });
    }
    const walletId = project.wallet;
    // const walletId = "681aa801c014b93b9b45aa94"; // Removed hardcoded value
    console.log("Wallet ID:", walletId);

    const walletObjectId = new mongoose.Types.ObjectId(walletId);

    const pipeline = [
      { $match: { wallet_id: walletObjectId } },
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
    console.log("cashFlowHistory:", cashFlowHistory);
    if (!cashFlowHistory.length) {
      return res.status(404).json({ message: "No transactions found for this project's wallet" });
    }

    res.status(200).json(cashFlowHistory);
  } catch (error) {
    console.error("Error retrieving cash flow history:", error.stack);
    res.status(500).json({ message: "Failed to retrieve cash flow history", error: error.message });
  }
};

// 📌 Get wallet balance by user
const getWalletBalanceByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }
    const wallet = await Wallet.findOne({ user_id: userId }).select("balance");
    if (!wallet) {
      return res.status(404).json({ message: "No wallet found for this user" });
    }
    res.status(200).json({ balance: wallet.balance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 📌 Calculate profit margin
const calculateProfitMargin = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const user = await userModel.findById(userObjectId).select("project");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.project) {
      return res.status(404).json({ message: "No project associated with this user" });
    }

    const project = await Project.findById(user.project).select("wallet");
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (!project.wallet) {
      return res.status(404).json({ message: "No wallet associated with this project" });
    }

    const walletId = project.wallet;
    // const walletId = "681aa801c014b93b9b45aa94"; // Removed hardcoded value
    const walletObjectId = new mongoose.Types.ObjectId(walletId);

    const pipeline = [
      { $match: { wallet_id: walletObjectId } },
      {
        $group: {
          _id: null,
          totalIncome: {
            $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] },
          },
          totalExpenses: {
            $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] },
          },
        },
      },
    ];

    const result = await Transaction.aggregate(pipeline);

    if (!result || result.length === 0) {
      return res.status(404).json({ message: "No transactions found for this wallet" });
    }

    const totalIncome = result[0].totalIncome;
    const totalExpenses = result[0].totalExpenses;
    const netIncome = totalIncome - totalExpenses;
    const profitMargin = totalIncome !== 0 ? (netIncome / totalIncome) * 100 : 0;

    res.status(200).json({
      profitMargin: profitMargin.toFixed(2) + "%",
      totalIncome,
      totalExpenses,
      netIncome,
    });
  } catch (error) {
    console.error("Error calculating profit margin:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getWallets,
  getWalletByUser,
  getWalletById,
  addWallet,
  deleteWallet,
  updateWallet,
  getTopProjects,
  getCandlestickData,
  calculateCashFlowHistory,
  calculateProfitMargin,
  getWalletBalanceByUser
};