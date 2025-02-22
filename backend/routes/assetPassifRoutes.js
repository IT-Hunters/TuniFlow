const express = require('express');
const router = express.Router();
const assetPassifController = require('../controllers/LiabilityController');

router.get('/', assetPassifController.getAllPassifs);
router.get('/:id', assetPassifController.getPassifById);
router.post('/', assetPassifController.createPassif);
router.put('/:id', assetPassifController.updatePassif);
router.delete('/:id', assetPassifController.deletePassif);

module.exports = router;