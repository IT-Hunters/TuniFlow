const express = require("express");
const router = express.Router();
const transactioncontroller = require("../controllers/transactioncontroller"); // Vérifie bien ce chemin


// 📌 Dépôt d'argent
router.post("/deposit/:walletId", transactioncontroller.deposit);

// 📌 Retrait d'argent
router.post("/withdraw/:walletId", transactioncontroller.withdraw);

// 📌 Obtenir le solde d'un wallet
router.get("/balance/:walletId", transactioncontroller.getBalance);

router.get("/getTransactions/:walletId", transactioncontroller.getTransactions); // Corrigé

// 📌 Annuler une transaction
router.put("/cancelTransaction/:transactionId", transactioncontroller.cancelTransaction); // Corrigé

// 📌 Mettre à jour une transaction
router.put("/updateTransaction/:transactionId", transactioncontroller.updateTransaction); // Corrigé

// 📌 Transférer de l'argent entre deux wallets
router.post("/transfer/:senderWalletId/:receiverWalletId", transactioncontroller.transfer);

module.exports = router;
