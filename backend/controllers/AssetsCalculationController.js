const mongoose = require('mongoose');
const AssetActif = require('../model/AssetActif/AssetActif');
const FinancialAsset = require("../model/AssetActif/FinancialAsset");
const IntangibleAsset = require("../model/AssetActif/IntangibleAsset");
const Receivable = require("../model/AssetActif/Receivable");
const Stock = require("../model/AssetActif/Stock");
const TangibleAsset = require("../model/AssetActif/TangibleAsset");
const Treasury = require("../model/AssetActif/Treasury");
const CurrentLiability = require("../model/AssetPassif/CurrentLiabilities");  

async function calculateWorkingCapital(projectId) {
    try {
        const objectId = new mongoose.ObjectId(projectId);

        const receivables = await Receivable.aggregate([
            { $match: { projet_id: objectId } },
            { $group: { _id: null, total: { $sum: '$total_value' } } }
        ]);

        const treasuries = await Treasury.aggregate([
            { $match: { projet_id: objectId } },
            { $group: { _id: null, total: { $sum: '$total_value' } } }
        ]);

        const stocks = await Stock.aggregate([
            { $match: { projet_id: objectId } },
            { $group: { _id: null, total: { $sum: { $multiply: ['$quantite', '$unite_value'] } } } }
        ]);

        const totalCurrentAssets = 
            (receivables[0]?.total || 0) + 
            (treasuries[0]?.total || 0) + 
            (stocks[0]?.total || 0);

        const currentLiabilities = await CurrentLiability.aggregate([
            { $match: { project_id: objectId } },
            { $group: { _id: null, total: { $sum: '$total_value' } } }
        ]);

        const totalCurrentLiabilities = currentLiabilities[0]?.total || 0;

        const workingCapital = totalCurrentAssets - totalCurrentLiabilities;

        return {
            projectId,
            totalCurrentAssets,
            totalCurrentLiabilities,
            workingCapital,
            status: workingCapital > 0 ? 'Sufficient' : 'Insufficient'
        };
    } catch (error) {
        console.error('Error calculating working capital:', error.message);
        throw new Error(`Failed to calculate working capital for project ${projectId}`);
    }
}

module.exports = { calculateWorkingCapital };
