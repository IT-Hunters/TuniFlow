const express = require('express');
const router = express.Router();
const taxeControllers = require('../controllers/taxeControllers');
const { authenticateJWT } = require('../config/autorisation');
// Taxes Routes
router.post('/taxes',authenticateJWT, taxeControllers.createTaxe);
router.get('/taxes',authenticateJWT, taxeControllers.getTaxes);
router.put('/taxes/:id', authenticateJWT,taxeControllers.updateTaxe);

// Obligations Fiscales Routes
router.post('/obligations-fiscales',authenticateJWT, taxeControllers.createObligationFiscale);
router.get('/obligations-fiscales', authenticateJWT,taxeControllers.getObligationsFiscales);
router.put('/obligations-fiscales/:id',authenticateJWT, taxeControllers.updateObligationFiscale);

// Tranches Imposition Routes
router.post('/tranches-imposition', authenticateJWT,taxeControllers.createTrancheImposition);
router.get('/tranches-imposition', authenticateJWT,taxeControllers.getTranchesImposition);
router.put('/tranches-imposition/:id', authenticateJWT,taxeControllers.updateTrancheImposition);

module.exports = router;
