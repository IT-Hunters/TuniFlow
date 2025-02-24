const Wallet = require("../model/wallet");
const Transaction = require("../model/Transaction");

// 📌 Effectuer un dépôt (Deposit)
exports.deposit = async (req, res) => {
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
    
    // Créer la transaction de retrait
    const transaction = new Transaction({
      wallet_id: walletId,
      amount: amount,
      type: "expense",
      balanceAfterTransaction: balance - amount
    });

    await Transaction(transaction).save();
    res.status(200).json({ message: "Dépôt effectué avec succès", transaction });
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

    // Calculer le solde actuel à partir des transactions
    const transactions = await Transaction.find({ wallet_id: walletId });
    const balance = transactions.reduce((acc, t) => acc + (t.type === "income" ? t.amount : -t.amount), 0);

    if (balance < amount) {
      return res.status(400).json({ message: "Fonds insuffisants" });
    }

    // Créer la transaction de retrait
    const transaction = new Transaction({
      wallet_id: walletId,
      amount: amount,
      type: "expenses",
      balanceAfterTransaction: balance - amount
    });

    await Transaction(transaction).save();
    res.status(200).json({ message: "Retrait effectué avec succès", transaction });
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
