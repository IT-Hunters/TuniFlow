const express = require("express");
const router = express.Router();
const transactioncontroller = require("../controllers/transactioncontroller"); // Vérifie bien ce chemin


// 📌 Dépôt d'argent
router.post("/deposit/:walletId", transactioncontroller.deposit);

// 📌 Retrait d'argent
router.post("/withdraw/:walletId", transactioncontroller.withdraw);

// 📌 Obtenir le solde d'un wallet
router.get("/balance/:walletId", transactioncontroller.getBalance);

router.get("/getTransactions/:walletId", transactioncontroller.getTransactions); 
router.get("/getTransactionByWalletId/:walletId", transactioncontroller.getTransactionByWalletId);

// 📌 Annuler une transaction
router.put("/cancelTransaction/:transactionId", transactioncontroller.cancelTransaction); 

// 📌 Mettre à jour une transaction
router.put("/updateTransaction/:transactionId", transactioncontroller.updateTransaction);
router.get("/expenses/:walletId", transactioncontroller.getExpenses);
// 📌 Transférer de l'argent entre deux wallets
router.post("/transfer/:senderWalletId/:receiverWalletId", transactioncontroller.transfer);
router.get("/getRevenue/:walletId", transactioncontroller.getRevenue);
router.get("/expenses/:walletId", transactioncontroller.getExpenses);
module.exports = router;
