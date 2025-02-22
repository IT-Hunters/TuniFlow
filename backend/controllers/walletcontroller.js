const Wallet = require("../model/wallet");

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

