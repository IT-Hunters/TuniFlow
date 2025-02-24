const express = require("express");
const router = express.Router();
const transactioncontroller = require("../controllers/transactioncontroller"); // Vérifie bien ce chemin


// 📌 Dépôt d'argent
router.post("/deposit/:walletId", transactioncontroller.deposit);

// 📌 Retrait d'argent
router.post("/withdraw/:walletId", transactioncontroller.withdraw);

// 📌 Obtenir le solde d'un wallet
router.get("/balance/:walletId", transactioncontroller.getBalance);

module.exports = router;
