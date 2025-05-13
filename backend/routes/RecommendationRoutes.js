const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Project = require('../model/Project'); // Adjust path as needed
const Wallet = require('../model/wallet'); // Adjust path as needed
const { predict, recommendProject, predictPriority, predictSpendingBehavior } = require('../controllers/RecommendationController');

router.post('/predict', async (req, res) => {
    try {
        const { userId } = req.body;

        // Validate input
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        // Find all wallets for the user
        const wallets = await Wallet.find({ user_id: userId });
        if (!wallets || wallets.length === 0) {
            return res.status(404).json({ error: 'No wallets found for the user' });
        }

        // Aggregate financial data
        const totalBalance = wallets.reduce((sum, wallet) => sum + (wallet.balance || 0), 0);
        const totalTransactions = wallets.reduce((sum, wallet) => sum + (wallet.transactions?.length || 0), 0);
        const avgBalancePerWallet = wallets.length ? totalBalance / wallets.length : 0;
        const earliestCreated = wallets.length ? 
            Math.min(...wallets.map(w => w.createdAt.getTime())) : 
            Date.now();
        const timeSpanDays = (Date.now() - earliestCreated) / (24 * 60 * 60 * 1000) || 1;

        const financialData = {
            total_spend: totalBalance,
            avg_spend: totalTransactions ? totalBalance / totalTransactions : 0,
            std_spend: wallets.length > 1 ? 
                Math.sqrt(
                    wallets.reduce((sum, w) => sum + Math.pow((w.balance || 0) - avgBalancePerWallet, 2), 0) / wallets.length
                ) : 0,
            avg_transaction_duration: 0,
            transaction_count: totalTransactions,
            debit_credit_ratio: 0.5,
            account_balance: totalBalance,
            customer_age: 35,
            customer_occupation: 1,
            avg_transactions_per_month: totalTransactions ? (totalTransactions / (timeSpanDays / 30)) : 0,
            trans_freq_ratio: totalTransactions ? (totalTransactions / (timeSpanDays / 30)) / (totalTransactions || 1) : 0
        };

        const prediction = await predict(financialData);

        res.status(200).json({
            success: true,
            data: {
                randomForestPrediction: prediction.randomForestPrediction,
                xgboostPrediction: prediction.xgboostPrediction,
                logisticRegressionPrediction: prediction.logisticRegressionPrediction,
                bestPrediction: prediction.bestPrediction
            }
        });
    } catch (error) {
        console.error('Error in predict:', error.message);
        res.status(500).json({ error: error.message || 'Server error' });
    }
});

router.post('/project', async (req, res) => {
    try {
        const { projectId } = req.body;

        // Validate input
        if (!projectId) {
            return res.status(400).json({ error: 'Project ID is required' });
        }

        // Verify project exists
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Find all wallets for the project's businessOwner
        const wallets = await Wallet.find({ user_id: project.businessOwner });
        if (!wallets || wallets.length === 0) {
            return res.status(404).json({ error: 'No wallets found for the project owner' });
        }

        // Aggregate financial data
        const totalBalance = wallets.reduce((sum, wallet) => sum + (wallet.balance || 0), 0);
        const totalTransactions = wallets.reduce((sum, wallet) => sum + (wallet.transactions?.length || 0), 0);
        const avgBalancePerWallet = wallets.length ? totalBalance / wallets.length : 0;
        const earliestCreated = wallets.length ? 
            Math.min(...wallets.map(w => w.createdAt.getTime())) : 
            Date.now();
        const timeSpanDays = (Date.now() - earliestCreated) / (24 * 60 * 60 * 1000) || 1;

        const financialData = {
            total_spend: totalBalance,
            avg_spend: totalTransactions ? totalBalance / totalTransactions : 0,
            std_spend: wallets.length > 1 ? 
                Math.sqrt(
                    wallets.reduce((sum, w) => sum + Math.pow((w.balance || 0) - avgBalancePerWallet, 2), 0) / wallets.length
                ) : 0,
            avg_transaction_duration: 0,
            transaction_count: totalTransactions,
            debit_credit_ratio: 0.5,
            account_balance: totalBalance,
            customer_age: 35,
            customer_occupation: 1,
            avg_transactions_per_month: totalTransactions ? (totalTransactions / (timeSpanDays / 30)) : 0,
            trans_freq_ratio: totalTransactions ? (totalTransactions / (timeSpanDays / 30)) / (totalTransactions || 1) : 0
        };

        const recommendation = await recommendProject(projectId, financialData);

        res.status(200).json({
            success: true,
            data: {
                projectId: recommendation.projectId,
                randomForestPrediction: recommendation.randomForestPrediction,
                xgboostPrediction: recommendation.xgboostPrediction,
                logisticRegressionPrediction: recommendation.logisticRegressionPrediction,
                bestRecommendation: recommendation.bestRecommendation
            }
        });
    } catch (error) {
        console.error('Error in project recommendation:', error.message);
        res.status(500).json({ error: error.message || 'Server error' });
    }
});

router.post('/priority', async (req, res) => {
    try {
        const { userId } = req.body;

        // Validate input
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        // Find all wallets for the user
        const wallets = await Wallet.find({ user_id: userId });
        if (!wallets || wallets.length === 0) {
            return res.status(404).json({ error: 'No wallets found for the user' });
        }

        // Aggregate financial data
        const totalBalance = wallets.reduce((sum, wallet) => sum + (wallet.balance || 0), 0);
        const totalTransactions = wallets.reduce((sum, wallet) => sum + (wallet.transactions?.length || 0), 0);
        const avgBalancePerWallet = wallets.length ? totalBalance / wallets.length : 0;
        const earliestCreated = wallets.length ? 
            Math.min(...wallets.map(w => w.createdAt.getTime())) : 
            Date.now();
        const timeSpanDays = (Date.now() - earliestCreated) / (24 * 60 * 60 * 1000) || 1;

        const financialData = {
            total_amount: totalBalance,
            avg_amount: totalTransactions ? totalBalance / totalTransactions : 0,
            std_amount: wallets.length > 1 ? 
                Math.sqrt(
                    wallets.reduce((sum, w) => sum + Math.pow((w.balance || 0) - avgBalancePerWallet, 2), 0) / wallets.length
                ) : 0,
            transaction_count: totalTransactions,
            transfer_ratio: 0.5, // Adjust if transaction type data is available
            avg_transactions_per_month: totalTransactions ? (totalTransactions / (timeSpanDays / 30)) : 0,
            trans_freq_ratio: totalTransactions ? (totalTransactions / (timeSpanDays / 30)) / (totalTransactions || 1) : 0,
            Timestamp_Hour: new Date().getHours(),
            Day_of_Month: new Date().getDate(),
            merchant_category: 'Unknown' // Adjust if merchant data is available
        };

        const prediction = await predictPriority(financialData);

        res.status(200).json({
            success: true,
            data: {
                randomForestPrediction: prediction.randomForestPrediction,
                xgboostPrediction: prediction.xgboostPrediction,
                logisticRegressionPrediction: prediction.logisticRegressionPrediction,
                bestPrediction: prediction.bestPrediction
            }
        });
    } catch (error) {
        console.error('Error in predictPriority:', error.message);
        res.status(500).json({ error: error.message || 'Server error' });
    }
});

router.post('/spending-behavior', async (req, res) => {
    try {
        const { userId } = req.body;

        // Validate input
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        // Find all wallets for the user
        const wallets = await Wallet.find({ user_id: userId });
        if (!wallets || wallets.length === 0) {
            return res.status(404).json({ error: 'No wallets found for the user' });
        }

        // Aggregate financial data
        const totalBalance = wallets.reduce((sum, wallet) => sum + (wallet.balance || 0), 0);
        const totalTransactions = wallets.reduce((sum, wallet) => sum + (wallet.transactions?.length || 0), 0);
        const earliestCreated = wallets.length ? 
            Math.min(...wallets.map(w => w.createdAt.getTime())) : 
            Date.now();
        const timeSpanDays = (Date.now() - earliestCreated) / (24 * 60 * 60 * 1000) || 1;

        const financialData = {
            Transaction_Amount: totalBalance,
            TransactionType: 'Unknown', // Adjust if transaction type data is available
            Merchant_Category: 'Unknown', // Adjust if merchant data is available
            Transaction_Frequency: totalTransactions ? (totalTransactions / timeSpanDays) : 0,
            Timestamp_Hour: new Date().getHours()
        };

        const prediction = await predictSpendingBehavior(financialData);

        res.status(200).json({
            success: true,
            data: {
                knnPrediction: prediction.knnPrediction,
                svmPrediction: prediction.svmPrediction,
                decisionTreePrediction: prediction.decisionTreePrediction,
                xgboostPrediction: prediction.xgboostPrediction,
                bestPrediction: prediction.bestPrediction
            }
        });
    } catch (error) {
        console.error('Error in predictSpendingBehavior:', error.message);
        res.status(500).json({ error: error.message || 'Server error' });
    }
});

module.exports = router;