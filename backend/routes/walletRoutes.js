const express = require("express");
const router = express.Router();
const walletcontroller = require("../controllers/walletcontroller");

// 📌 Routes des wallets
router.get("/getWallets", walletcontroller.getWallets);
router.post("/addWallet", walletcontroller.addWallet);
router.delete("/deleteWallet/:walletId", walletcontroller.deleteWallet);
router.put('/:walletId', walletcontroller.updateWallet);
router.get('/cashflow/candlestick', walletcontroller.getCandlestickData);
router.get('/cashflow/candlestick2/:walletId', walletcontroller.calculateCashFlowHistory);
router.get("/wallet/:walletId", walletcontroller.getWallets);
module.exports = router;
