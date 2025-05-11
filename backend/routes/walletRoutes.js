const express = require("express");
const router = express.Router();
const walletcontroller = require("../controllers/walletcontroller");

// 📌 Wallet routes
router.get("/getWallets", walletcontroller.getWallets); // Get all wallets
router.post("/addWallet", walletcontroller.addWallet); // Add a new wallet
router.delete("/deleteWallet/:walletId", walletcontroller.deleteWallet); // Delete a wallet by walletId
router.put("/:walletId", walletcontroller.updateWallet); // Update a wallet by walletId
router.get("/cashflow/candlestick", walletcontroller.getCandlestickData); // Get candlestick chart data
router.get("/cashflow/candlestick2/:userId", walletcontroller.calculateCashFlowHistory); // Get cash flow history by userId
router.get("/wallet/:walletId", walletcontroller.getWalletById); // Get wallet by walletId
router.get("/user/:userId", walletcontroller.getWalletByUser); // Get wallet by userId
router.get("/top-projects", walletcontroller.getTopProjects); // Get top 5 projects by wallet balance
router.get("/calculateProfitMargin/:userId", walletcontroller.calculateProfitMargin); // Calculate profit margin by userId
router.get("/balance/user/:userId", walletcontroller.getWalletBalanceByUser); // Get wallet balance by userId

module.exports = router;