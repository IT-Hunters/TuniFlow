const mongoose = require('mongoose');
const AssetActif = require('../model/AssetActif/AssetActif');
const Liability = require("../model/AssetPassif/Liability");

async function calculateWorkingCapital(req, res) {
    try {
        const objectId = new mongoose.Types.ObjectId(req.params.id);
        console.log('ObjectId:', objectId);

        const today = new Date();
        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(today.getDate() - 5);

        const assetActifs = await AssetActif.aggregate([
            { 
                $match: { 
                    project_id: objectId,
                    type_actif: { $in: ['Receivables', 'Treasury', 'Stock'] },
                    date_acquisition: { $gte: fiveDaysAgo, $lte: today } 
                }
            },
            {
                $group: {
                    _id: { date: "$date_acquisition" }, 
                    totalAssets: { $sum: '$total_value' }
                }
            },
            { $sort: { "_id.date": 1 } }
        ]);

        const currentLiabilities = await Liability.aggregate([
            { 
                $match: { 
                    project_id: objectId,
                    type_liability: 'CurrentLiabilities',
                    date_commitment: { $gte: fiveDaysAgo, $lte: today } 
                }
            },
            {
                $group: {
                    _id: { date: "$date_commitment" },
                    totalLiabilities: { $sum: '$total_value' }
                }
            },
            { $sort: { "_id.date": 1 } }
        ]);

        console.log(currentLiabilities);

        const workingCapitalByDate = assetActifs.map(asset => {
            const liability = currentLiabilities.find(liab => 
                new Date(liab._id.date).toISOString().split("T")[0] === new Date(asset._id.date).toISOString().split("T")[0]
            );

            const totalLiabilities = liability ? liability.totalLiabilities : 0;

            return {
                date: asset._id.date.toISOString().split("T")[0], 
                totalCurrentAssets: asset.totalAssets,
                totalCurrentLiabilities: totalLiabilities,
                workingCapital: asset.totalAssets - totalLiabilities
            };
        });

        res.json({
            projectId: req.params.id,
            workingCapitalByDate
        });

    } catch (error) {
        console.error('Error calculating working capital:', error.message);
        res.status(500).json({ error: `Failed to calculate working capital for project ${req.params.id}` });
    }
}

module.exports = { calculateWorkingCapital };
