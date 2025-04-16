const express = require("express");
const router = express.Router();
const walletcontroller = require("../controllers/walletcontroller");
const { authenticateJWT } = require('../config/autorisation');
// 📌 Routes des wallets
router.get("/getWallets", authenticateJWT,walletcontroller.getWallets); // Tous les wallets
router.post("/addWallet", authenticateJWT,walletcontroller.addWallet); // Ajouter un wallet
router.delete("/deleteWallet/:walletId", authenticateJWT,walletcontroller.deleteWallet); // Supprimer un wallet
router.put("/:walletId", authenticateJWT,walletcontroller.updateWallet); // Mettre à jour un wallet
router.get("/cashflow/candlestick", authenticateJWT,walletcontroller.getCandlestickData);
router.get("/cashflow/candlestick2/:projectId", authenticateJWT,walletcontroller.calculateCashFlowHistory);
router.get("/wallet/:walletId", authenticateJWT,walletcontroller.getWalletById); // Récupérer un wallet par walletId (à ajouter)
router.get("/user/:userId", authenticateJWT,walletcontroller.getWalletByUser); // Récupérer un wallet par userId
router.get("/top-projects", authenticateJWT,walletcontroller.getTopProjects);
router.get("/calculateProfitMargin/:walletId", authenticateJWT,walletcontroller.calculateProfitMargin);
module.exports = router;