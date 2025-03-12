const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/InvoiceController');
const { authenticateJWT } = require('../config/autorisation'); // Utilisez le bon chemin
const authorizeRole = require('../middleware/autorizedrole');

router.post('/invoices', 
  authenticateJWT, // Remplace authMiddleware
  authorizeRole(["BUSINESS_MANAGER"]), 
  invoiceController.createInvoice
);
router.post('/invoices/send/:invoiceId', 
  authenticateJWT, 
  authorizeRole(["BUSINESS_MANAGER"]), 
  invoiceController.sendInvoice
);
router.put('/invoices/:invoiceId/accept', 
  authenticateJWT, 
  authorizeRole(["BUSINESS_OWNER"]), 
  invoiceController.acceptInvoice
);
router.get('/invoices/my-invoices', 
  authenticateJWT, 
  authorizeRole(["BUSINESS_OWNER"]), 
  invoiceController.getMyInvoices
);
router.get('/users/business-owners', 
  authenticateJWT, 
  authorizeRole(["BUSINESS_MANAGER"]), 
  invoiceController.getBusinessOwners
);

module.exports = router;