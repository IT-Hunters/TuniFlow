const express = require('express');
const router = express.Router();
const assetPassifController = require('../controllers/LiabilityController');
const { authenticateJWT } = require('../config/autorisation');
router.get('/',authenticateJWT, assetPassifController.getAllPassifs);
router.get('/:id',authenticateJWT, assetPassifController.getPassifById);
router.post('/',authenticateJWT, assetPassifController.createPassif);
router.put('/:id',authenticateJWT, assetPassifController.updatePassif);
router.delete('/:id',authenticateJWT, assetPassifController.deletePassif);

module.exports = router;