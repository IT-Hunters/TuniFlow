const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/InvoiceController');
const { authenticateJWT } = require('../config/autorisation'); // Utilisez le bon chemin
const authorizeRole = require('../middleware/autorizedrole');

router.post('/create', 
  authenticateJWT, 
  authorizeRole(["BUSINESS_MANAGER"]), 
  invoiceController.createInvoice
);
router.post('/send/:invoiceId', 
  authenticateJWT, 
  authorizeRole(["BUSINESS_MANAGER"]), 
  invoiceController.sendInvoice
);
router.put('/:invoiceId/accept', 
  authenticateJWT, 
  authorizeRole(["BUSINESS_OWNER"]), 
  invoiceController.acceptInvoice
);
router.get('/my-invoices', 
  authenticateJWT, 
  authorizeRole(["BUSINESS_OWNER"]), 
  invoiceController.getMyInvoices
);
router.get('/business-owners', 
  authenticateJWT, 
  authorizeRole(["BUSINESS_MANAGER"]), 
  invoiceController.getBusinessOwners
);
router.get("/my-sent-invoices", authenticateJWT, invoiceController.getMySentInvoices)
router.get("/statistics", authenticateJWT, invoiceController.getInvoiceStatistics);
router.post("/upload-logo", authenticateJWT, invoiceController.uploadLogo, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Aucun fichier téléchargé" });
  }
  const logoUrl = `/uploads/logos/${req.file.filename}`;
  res.status(200).json({ logoUrl });
});
router.get('/export', authenticateJWT, invoiceController.exportInvoices);
router.get("/test-upcoming-reminders", invoiceController.testUpcomingReminders);
router.post('/generate-description', invoiceController.generateDescription);
router.post('/predict-payment', invoiceController.predictPaymentLikelihood);
router.post('/batch-predict-payment', invoiceController.batchPredictPaymentLikelihood);
module.exports = router;