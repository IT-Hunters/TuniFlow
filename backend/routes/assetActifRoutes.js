const express = require('express');
const router = express.Router();
const assetActifController = require('../controllers/assetActifController');

router.get('/', assetActifController.getAllAssets);
router.get('/:id', assetActifController.getAssetById);
router.post('/', assetActifController.createAsset);
router.put('/:id', assetActifController.updateAsset);
router.delete('/:id', assetActifController.deleteAsset);

module.exports = router;