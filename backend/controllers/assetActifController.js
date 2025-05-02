const AssetActif = require('../model/AssetActif/AssetActif');
const FinancialAsset = require("../model/AssetActif/FinancialAsset");
const IntangibleAsset = require("../model/AssetActif/IntangibleAsset");
const Receivable = require("../model/AssetActif/Receivable");
const Stock = require("../model/AssetActif/Stock");
const TangibleAsset = require("../model/AssetActif/TangibleAsset");
const Treasury = require("../model/AssetActif/Treasury");
exports.getAllAssets = async (req, res) => {
    try {
        const assets = await AssetActif.find().sort({ timestamp: -1 , total_value: -1 });
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
        if (Array.isArray(req.body)) {
            const newAssets = await Promise.all(req.body.map(async (assetData) => {
                return createSpecificAsset(assetData);
            }));
            res.status(201).json(newAssets);
        } else {
            const newAsset = await createSpecificAsset(req.body);
            res.status(201).json(newAsset);
        }
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
const createSpecificAsset = async (assetData) => {
    let assetModel;
    
    switch (assetData.type_actif) {
        case "Financial Asset":
            assetModel = FinancialAsset;
            break;
        case "Intangible Asset":
            assetModel = IntangibleAsset;
            break;
        case "Receivables":
            assetModel = Receivable;
            break;
        case "Stock":
            assetModel = Stock;
            break;
        case "Tangible Asset":
            assetModel = TangibleAsset;
            break;
        case "Treasury":
            assetModel = Treasury;
            break;
        default:
            assetModel = AssetActif;
            break;
    }

    return new AssetActif(assetData).save();
};