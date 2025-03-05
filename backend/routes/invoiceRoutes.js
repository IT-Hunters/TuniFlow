const express = require('express');
const router = express.Router();
const InvoiceController = require('../controllers/InvoiceController');


router.post('/', InvoiceController.createInvoice);

router.post("/send/:invoiceId", InvoiceController.sendInvoice);


module.exports = router;
