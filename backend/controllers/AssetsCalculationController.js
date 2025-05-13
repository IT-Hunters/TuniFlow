const mongoose = require('mongoose');
const AssetActif = require('../model/AssetActif/AssetActif');
const Liability = require("../model/AssetPassif/Liability");

async function calculateWorkingCapital(req, res) {
   try {
        const objectId = new mongoose.Types.ObjectId(req.params.id);
       // console.log('ObjectId:', objectId);
         
        const today = new Date();
        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(today.getDate() - 5);

        const assetActifs = await AssetActif.aggregate([
            { 
                $match: { 
                    projet_id: objectId,
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
        console.log("assets actifs : " + JSON.stringify(assetActifs));
        
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

        console.log("currentLiabilities : " + JSON.stringify(currentLiabilities));

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
async function calculateWorkingCapitalStatus(req, res) {
      try {
        const objectId = new mongoose.Types.ObjectId(req.params.id);
        console.log('Project ID:', objectId); // Log the project ID for debugging
        
        const today = new Date();
        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(today.getDate() - 5);

        console.log('Date range:', fiveDaysAgo, today); // Log the date range for debugging

        // Get assets (ensure correct field names like 'projet_id' instead of 'project_id')
        const assetActifs = await AssetActif.aggregate([
            { 
                $match: { 
                    projet_id: objectId, // Corrected field name to 'projet_id'
                    type_actif: { $in: ['Receivables', 'Treasury', 'Stock'] },
                    date_acquisition: { $gte: fiveDaysAgo, $lte: today }
                }
            },
            {
                $group: {
                    _id: null,
                    totalAssets: { $sum: '$total_value' }
                }
            }
        ]);
        console.log('Asset Actifs:', assetActifs); // Log the asset data for debugging

        // If no assets are found, handle the case
        if (assetActifs.length === 0) {
            console.log('No assets found for the project.');
        }

        // Get liabilities (ensure correct field names like 'projet_id' instead of 'project_id')
        const currentLiabilities = await Liability.aggregate([
            { 
                $match: { 
                    projet_id: objectId, // Corrected field name to 'projet_id'
                    type_liability: 'CurrentLiabilities',
                    date_commitment: { $gte: fiveDaysAgo, $lte: today }
                }
            },
            {
                $group: {
                    _id: null,
                    totalLiabilities: { $sum: '$total_value' }
                }
            }
        ]);
        console.log('Current Liabilities:', currentLiabilities); // Log liabilities for debugging

        // Calculate current values
        const totalAssets = assetActifs.length > 0 ? assetActifs[0].totalAssets : 0;
        const totalLiabilities = currentLiabilities.length > 0 ? currentLiabilities[0].totalLiabilities : 0;
        const workingCapital = totalAssets - totalLiabilities;

        // For the change calculation, get previous period's data
        const tenDaysAgo = new Date();
        tenDaysAgo.setDate(today.getDate() - 10);

        const previousAssets = await AssetActif.aggregate([
            { 
                $match: { 
                    projet_id: objectId, // Corrected field name to 'projet_id'
                    type_actif: { $in: ['Receivables', 'Treasury', 'Stock'] },
                    date_acquisition: { $gte: tenDaysAgo, $lte: fiveDaysAgo }
                }
            },
            {
                $group: {
                    _id: null,
                    totalAssets: { $sum: '$total_value' }
                }
            }
        ]);
        console.log('Previous Asset Actifs:', previousAssets); // Log previous assets for debugging

        const previousLiabilities = await Liability.aggregate([
            { 
                $match: { 
                    projet_id: objectId, // Corrected field name to 'projet_id'
                    type_liability: 'CurrentLiabilities',
                    date_commitment: { $gte: tenDaysAgo, $lte: fiveDaysAgo }
                }
            },
            {
                $group: {
                    _id: null,
                    totalLiabilities: { $sum: '$total_value' }
                }
            }
        ]);
        console.log('Previous Liabilities:', previousLiabilities); // Log previous liabilities for debugging

        // Calculate the previous working capital and change
        const prevTotalAssets = previousAssets.length > 0 ? previousAssets[0].totalAssets : 0;
        const prevTotalLiabilities = previousLiabilities.length > 0 ? previousLiabilities[0].totalLiabilities : 0;
        const previousWorkingCapital = prevTotalAssets - prevTotalLiabilities;
        const change = workingCapital - previousWorkingCapital;

        // Format the response
        const response = {
            title: "Working Capital Status",
            value: workingCapital.toLocaleString(), // Formats number with commas
            change: change >= 0 ? `+${change.toLocaleString()}` : change.toLocaleString(),
            icon: "👥",
            trend: change >= 0 ? "up" : "down"
        };

        res.json({
            projectId: req.params.id,
            workingCapitalStatus: response
        });

    } catch (error) {
        console.error('Error calculating working capital status:', error.message);
        res.status(500).json({ 
            error: `Failed to calculate working capital status for project ${req.params.id}` 
        });
    }
}

module.exports = { calculateWorkingCapital,calculateWorkingCapitalStatus };
