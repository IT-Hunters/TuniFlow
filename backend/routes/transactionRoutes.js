const express = require("express");
const router = express.Router();
const transactioncontroller = require("../controllers/transactioncontroller"); // Vérifie bien ce chemin
const { authenticateJWT } = require('../config/autorisation');

// 📌 Dépôt d'argent
router.post("/deposit/:walletId", authenticateJWT,transactioncontroller.deposit);

// 📌 Retrait d'argent
router.post("/withdraw/:walletId", authenticateJWT,transactioncontroller.withdraw);

// 📌 Obtenir le solde d'un wallet
router.get("/balance/:walletId",authenticateJWT, transactioncontroller.getBalance);

router.get("/getTransactions/:walletId",authenticateJWT, transactioncontroller.getTransactions); 
router.get("/getTransactionByWalletId/:walletId", authenticateJWT,transactioncontroller.getTransactionByWalletId);

// 📌 Annuler une transaction
router.put("/cancelTransaction/:transactionId", authenticateJWT,transactioncontroller.cancelTransaction); 

// 📌 Mettre à jour une transaction
router.put("/updateTransaction/:transactionId", authenticateJWT,transactioncontroller.updateTransaction);
router.get("/expenses/:walletId", authenticateJWT,transactioncontroller.getExpenses);
// 📌 Transférer de l'argent entre deux wallets
router.post("/transfer/:senderWalletId/:receiverWalletId",authenticateJWT, transactioncontroller.transfer);
router.get("/getRevenue/:walletId", authenticateJWT,transactioncontroller.getRevenue);
router.get("/expenses/:walletId",authenticateJWT, transactioncontroller.getExpenses);
module.exports = router;
