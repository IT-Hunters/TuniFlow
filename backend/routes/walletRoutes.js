const express = require("express");
const router = express.Router();
const walletcontroller = require("../controllers/walletcontroller");

// 📌 Routes des wallets
router.get("/getWallets", walletcontroller.getWallets);
router.post("/addWallet", walletcontroller.addWallet);
router.delete("/deleteWallet/:walletId", walletcontroller.deleteWallet);
router.put('/:walletId', walletcontroller.updateWallet);


module.exports = router;
