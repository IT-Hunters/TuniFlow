const express = require('express');
const router = express.Router();
const { authenticateJWT } = require("../config/autorisation");
const { createObjectif, findObjectifs, markObjectifAsCompleted, markObjectifAsFailed, deleteObjectifById, updateObjectifById,
    getAllObjectifsByProjectId, updateProgress, generateObjectiveReport, getObjectifTypes, getProjectsOverview, getbyid } = require("../controllers/ObjectifController");
const Objectif = require('../model/Objectif'); // Import the Objectif model for the analytics route

// Create a new objective
router.post("/createobjectifs", authenticateJWT, createObjectif);

// Get all objectives
router.get("/findobjectifs", authenticateJWT, findObjectifs);

// Mark an objective as completed
router.put("/complete/:objectifId", authenticateJWT, markObjectifAsCompleted);

// Mark an objective as failed
router.put("/fail/:objectifId", authenticateJWT, markObjectifAsFailed);

// Delete an objective by ID
router.delete("/deletobjectif/:objectifId", authenticateJWT, deleteObjectifById);

// Update an objective by ID
router.put("/updateobjectif/:objectifId", authenticateJWT, updateObjectifById);

// Get all objectives by project ID
router.get("/getAllObjectifsByProjectId/:projectId", authenticateJWT, getAllObjectifsByProjectId);

// Get an objective by ID
router.get("/getbyid/:id", authenticateJWT, getbyid);

// Update objective progress
router.put('/updateProgress/:objectifId', authenticateJWT, updateProgress);

// Generate objective report for a project
router.get('/generateObjectiveReport/:projectId', authenticateJWT, generateObjectiveReport);

// Get objective types (no authentication needed)
router.get('/typesobjectif', getObjectifTypes);

// Get projects overview
router.get('/getProjectsOverview/:projectSearch', authenticateJWT, getProjectsOverview);

// Get analytics for an objective
router.get('/analytics/:id', authenticateJWT, async (req, res) => {
    const { id } = req.params;

    try {
        const objective = await Objectif.findById(id).populate('project');
        if (!objective) {
            return res.status(404).json({ message: 'Objective not found' });
        }

        // Fetch similar objectives in the same project
        const similarObjectives = await Objectif.find({
            project: objective.project,
            objectivetype: objective.objectivetype,
            _id: { $ne: id },
        });

        // Calculate success/failure rate of similar objectives
        const totalSimilar = similarObjectives.length;
        const completedSimilar = similarObjectives.filter((obj) => obj.status === 'Completed').length;
        const successRate = totalSimilar > 0 ? (completedSimilar / totalSimilar) * 100 : 0;

        // Calculate time remaining
        const dueDate = new Date(objective.datefin);
        const timeRemaining = (dueDate - new Date()) / (1000 * 60 * 60 * 24); // Days remaining

        // Simple failure prediction algorithm
        const progressPerDayNeeded = (100 - objective.progress) / Math.max(timeRemaining, 1);
        const averageProgressPerDay = objective.progressHistory.length > 1
            ? (objective.progress / ((new Date() - new Date(objective.datedebut)) / (1000 * 60 * 60 * 24)))
            : 0;

        const failureRisk = progressPerDayNeeded > averageProgressPerDay * 1.5 ? 'High' : 'Low';

        res.json({
            progressHistory: objective.progressHistory,
            successRate,
            failureRisk,
            timeRemaining: Math.ceil(timeRemaining),
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch analytics', error });
    }
});

module.exports = router;