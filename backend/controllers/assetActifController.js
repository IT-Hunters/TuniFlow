const AssetActif = require('../model/AssetActif/AssetActif');

exports.getAllAssets = async (req, res) => {
    try {
        const assets = await AssetActif.find();
        res.status(200).json(assets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAssetById = async (req, res) => {
    try {
        const asset = await AssetActif.findById(req.params.id);
        if (!asset) return res.status(404).json({ message: 'Asset not found' });
        res.status(200).json(asset);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createAsset = async (req, res) => {
    try {
        const newAsset = new AssetActif(req.body);
        await newAsset.save();
        res.status(201).json(newAsset);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateAsset = async (req, res) => {
    try {
        const updatedAsset = await AssetActif.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedAsset) return res.status(404).json({ message: 'Asset not found' });
        res.status(200).json(updatedAsset);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteAsset = async (req, res) => {
    try {
        const deletedAsset = await AssetActif.findByIdAndDelete(req.params.id);
        if (!deletedAsset) return res.status(404).json({ message: 'Asset not found' });
        res.status(200).json({ message: 'Asset deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};