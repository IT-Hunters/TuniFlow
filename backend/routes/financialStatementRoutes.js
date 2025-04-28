const express = require("express");
const router = express.Router();
const financialStatementController = require("../controllers/financialStatementController");
const { authenticateJWT } = require('../config/autorisation'); // Utilisez le bon chemin



router.post("/generate", authenticateJWT, financialStatementController.generateFinancialStatement);
router.get("/wallet/:walletId", authenticateJWT, financialStatementController.getFinancialStatementsByWallet);
router.delete("/:statementId", authenticateJWT, financialStatementController.deleteFinancialStatement);
router.put("/:statementId", authenticateJWT, financialStatementController.updateFinancialStatement);
router.post("/regenerate/:statementId", authenticateJWT, financialStatementController.regenerateFinancialStatement);
router.post("/forecast", authenticateJWT, financialStatementController.forecastTaxes);

module.exports = router;