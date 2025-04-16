const express = require('express');
const router = express.Router();
const assetActifController = require('../controllers/assetActifController');
const { authenticateJWT } = require('../config/autorisation');
//const { authorizeRole } = require('../middleware/autorizedrole');
router.get('/',authenticateJWT, assetActifController.getAllAssets);
router.get('/:id',authenticateJWT, assetActifController.getAssetById);
router.post('/', authenticateJWT,assetActifController.createAsset);
router.put('/:id', authenticateJWT,assetActifController.updateAsset);
router.delete('/:id',authenticateJWT, assetActifController.deleteAsset);
// authorizeRole(["admin"])
module.exports = router;