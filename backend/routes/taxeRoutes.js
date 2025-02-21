const express = require('express');
const router = express.Router();
const taxeControllers = require('../controllers/taxeControllers');

// Taxes Routes
router.post('/taxes', taxeControllers.createTaxe);
router.get('/taxes', taxeControllers.getTaxes);
router.put('/taxes/:id', taxeControllers.updateTaxe);

// Obligations Fiscales Routes
router.post('/obligations-fiscales', taxeControllers.createObligationFiscale);
router.get('/obligations-fiscales', taxeControllers.getObligationsFiscales);
router.put('/obligations-fiscales/:id', taxeControllers.updateObligationFiscale);

// Tranches Imposition Routes
router.post('/tranches-imposition', taxeControllers.createTrancheImposition);
router.get('/tranches-imposition', taxeControllers.getTranchesImposition);
router.put('/tranches-imposition/:id', taxeControllers.updateTrancheImposition);

module.exports = router;
