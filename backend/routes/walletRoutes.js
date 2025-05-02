const express = require("express");
const router = express.Router();
const walletcontroller = require("../controllers/walletcontroller");

// 📌 Wallet routes
router.get("/getWallets", walletcontroller.getWallets);
router.post("/addWallet", walletcontroller.addWallet);
router.delete("/deleteWallet/:walletId", walletcontroller.deleteWallet);
router.put("/:walletId", walletcontroller.updateWallet);
router.get("/cashflow/candlestick", walletcontroller.getCandlestickData);
router.get("/cashflow/candlestick2/:userId", walletcontroller.calculateCashFlowHistory);
router.get("/wallet/:walletId", walletcontroller.getWalletById);
router.get("/user/:userId", walletcontroller.getWalletByUser); // Changed from projectId to userId
router.get("/top-projects", walletcontroller.getTopProjects);
router.get("/calculateProfitMargin/:userId", walletcontroller.calculateProfitMargin); // Changed from projectId to userId

module.exports = router;