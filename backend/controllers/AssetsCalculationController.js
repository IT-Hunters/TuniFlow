const mongoose = require('mongoose');
const AssetActif = require('../model/AssetActif/AssetActif');
const Liability = require("../model/AssetPassif/Liability");
const User = require("../model/user");
const Project = require("../model/Project");
async function calculateWorkingCapital(req, res) {
    try {
        const { userId } = req.params;
        console.log('ID:', userId); 
        const objectId = new mongoose.Types.ObjectId(userId);
        console.log('User ID:', objectId); // Log the user ID for debugging

        // Fetch user and their project field
        const user = await User.findById(objectId).select("project");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        console.log('User retrieved:', user); // Log user for debugging

        // Check if user has a project assigned
        if (!user.project) {
            return res.status(404).json({ message: "No project associated with this user" });
        }
        console.log('Project ID:', user.project); // Log project ID for debugging

        const project = await Project.findById(user.project)
        .populate('assets_actif')
        .populate('assets_passif')
        .exec();
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }
        console.log('Project:', project);

        const projectObjectId = project._id;

        const today = new Date();
        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(today.getDate() - 5);

        const assetActifs = await AssetActif.aggregate([
            { 
                $match: { 
                    projet_id: projectObjectId,
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
        console.log("Assets Actifs:", JSON.stringify(assetActifs));
        
        const currentLiabilities = await Liability.aggregate([
            { 
                $match: { 
                    project_id: projectObjectId,
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
        console.log("Current Liabilities:", JSON.stringify(currentLiabilities));

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
            userId,
            projectId: projectObjectId.toString(),
            workingCapitalByDate
        });

    } catch (error) {
        console.error('Error calculating working capital:', error.message);
        res.status(500).json({ error: `Failed to calculate working capital for user ${req.params.userId}` });
    }
}

async function calculateWorkingCapitalStatus(req, res) {
    try {
      const { userId } = req.params;
      console.log('IDDDDD:', userId); 
      const objectId = new mongoose.Types.ObjectId(userId);
      console.log('User IDDDDD:', objectId); // Log the user ID for debugging

      // Fetch user and their project field
      const user = await User.findById(objectId).select("project");
      if (!user) {
          return res.status(404).json({ message: "User not found" });
      }
      console.log('User retrieved:', user); // Log user for debugging

      // Check if user has a project assigned
      if (!user.project) {
          return res.status(404).json({ message: "No project associated with this user" });
      }
      console.log('Project ID:', user.project); // Log project ID for debugging

      // Find project by ID
      const project = await Project.findById(user.project)
          .populate('businessManager', 'fullname email')
          .populate('accountants', 'fullname email')
          .populate('financialManagers', 'fullname email')
          .populate('businessOwner', 'fullname email')
          .populate('rhManagers', 'fullname email')
          .populate('taxes')
          .populate('assets_actif')
          .exec();

      if (!project) {
          return res.status(404).json({ message: "Project not found" });
      }
      console.log('Project retrieved:', project); 
  
      if (!project.wallet) {
        return res.status(404).json({ message: "No wallet associated with this project" });
      }
      console.log("Wallet ID:", project.wallet);
  
      const projectId = project._id.toString();
      const projectObjectId = new mongoose.Types.ObjectId(projectId);
  
      const today = new Date();
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(today.getDate() - 5);
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(today.getDate() - 10);
  
      console.log('Date range (current):', fiveDaysAgo, today);
      console.log('Date range (previous):', tenDaysAgo, fiveDaysAgo);
  
      // Get current assets for the project
      const assetActifs = await AssetActif.aggregate([
        {
          $match: {
            projet_id: projectObjectId,
            type_actif: { $in: ['Receivables', 'Treasury', 'Stock'] },
            date_acquisition: { $gte: fiveDaysAgo, $lte: today },
          },
        },
        {
          $group: {
            _id: null,
            totalAssets: { $sum: '$total_value' },
          },
        },
      ]);
      console.log('Asset Actifs (current):', assetActifs);
  
      // Get current liabilities for the project
      const currentLiabilities = await Liability.aggregate([
        {
          $match: {
            projet_id: projectObjectId,
            type_liability: 'CurrentLiabilities',
            date_commitment: { $gte: fiveDaysAgo, $lte: today },
          },
        },
        {
          $group: {
            _id: null,
            totalLiabilities: { $sum: '$total_value' },
          },
        },
      ]);
      console.log('Current Liabilities (current):', currentLiabilities);
  
      // Calculate current values
      const totalAssets = assetActifs.length > 0 ? assetActifs[0].totalAssets : 0;
      const totalLiabilities = currentLiabilities.length > 0 ? currentLiabilities[0].totalLiabilities : 0;
      const workingCapital = totalAssets - totalLiabilities;
  
      // Get previous period's assets
      const previousAssets = await AssetActif.aggregate([
        {
          $match: {
            projet_id: projectObjectId,
            type_actif: { $in: ['Receivables', 'Treasury', 'Stock'] },
            date_acquisition: { $gte: tenDaysAgo, $lte: fiveDaysAgo },
          },
        },
        {
          $group: {
            _id: null,
            totalAssets: { $sum: '$total_value' },
          },
        },
      ]);
      console.log('Previous Asset Actifs:', previousAssets);
  
      // Get previous period's liabilities
      const previousLiabilities = await Liability.aggregate([
        {
          $match: {
            projet_id: projectObjectId,
            type_liability: 'CurrentLiabilities',
            date_commitment: { $gte: tenDaysAgo, $lte: fiveDaysAgo },
          },
        },
        {
          $group: {
            _id: null,
            totalLiabilities: { $sum: '$total_value' },
          },
        },
      ]);
      console.log('Previous Liabilities:', previousLiabilities);
  
      // Calculate previous working capital and change
      const prevTotalAssets = previousAssets.length > 0 ? previousAssets[0].totalAssets : 0;
      const prevTotalLiabilities = previousLiabilities.length > 0 ? previousLiabilities[0].totalLiabilities : 0;
      const previousWorkingCapital = prevTotalAssets - prevTotalLiabilities;
      const change = workingCapital - previousWorkingCapital;
  
      // Format the response
      const response = {
        title: "Working Capital Status",
        value: workingCapital.toLocaleString(),
        change: change >= 0 ? `+${change.toLocaleString()}` : change.toLocaleString(),
        icon: "👥",
        trend: change >= 0 ? "up" : "down",
      };
  
      res.json({
        projectId,
        workingCapitalStatus: response,
      });
    } catch (error) {
      console.error('Error calculating working capital status:', error.stack);
      res.status(500).json({
        message: `Failed to calculate working capital status for project ${req.params.projectId}`,
        error: error.message,
      });
    }
  };


module.exports = { calculateWorkingCapital,calculateWorkingCapitalStatus };
