const express = require("express");
const router = express.Router();
const walletcontroller = require("../controllers/walletcontroller");

// 📌 Routes des wallets
router.get("/getWallets", walletcontroller.getWallets); // Tous les wallets
router.post("/addWallet", walletcontroller.addWallet); // Ajouter un wallet
router.delete("/deleteWallet/:walletId", walletcontroller.deleteWallet); // Supprimer un wallet
router.put("/:walletId", walletcontroller.updateWallet); // Mettre à jour un wallet
router.get("/cashflow/candlestick", walletcontroller.getCandlestickData);
router.get("/cashflow/candlestick2/:walletId", walletcontroller.calculateCashFlowHistory);
router.get("/wallet/:walletId", walletcontroller.getWalletById); // Récupérer un wallet par walletId (à ajouter)
router.get("/user/:userId", walletcontroller.getWalletByUser); // Récupérer un wallet par userId
router.get("/top-projects", walletcontroller.getTopProjects);
router.get("/calculateProfitMargin/:walletId", walletcontroller.calculateProfitMargin);
module.exports = router;