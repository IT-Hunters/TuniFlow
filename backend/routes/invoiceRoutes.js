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

module.exports = router;