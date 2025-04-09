const express = require('express');
const router = express.Router();
const { authenticateJWT } = require("../config/autorisation");
const { createObjectif, findObjectifs, markObjectifAsCompleted, markObjectifAsFailed, deleteObjectifById, updateObjectifById,
    getAllObjectifsByProjectId, updateProgress, generateObjectiveReport, getObjectifTypes, getProjectsOverview, getbyid } = require("../controllers/ObjectifController");

router.post("/createobjectifs", authenticateJWT, createObjectif);
router.get("/findobjectifs", authenticateJWT, findObjectifs);
router.put("/complete/:objectifId", authenticateJWT, markObjectifAsCompleted);
router.put("/fail/:objectifId", authenticateJWT, markObjectifAsFailed);
router.delete("/deletobjectif/:objectifId", authenticateJWT, deleteObjectifById);
router.put("/updateobjectif/:objectifId", authenticateJWT, updateObjectifById);
router.get("/getAllObjectifsByProjectId/:projectId", authenticateJWT, getAllObjectifsByProjectId);
router.get("/getbyid/:id", authenticateJWT, getbyid); // Add authenticateJWT
router.put('/updateProgress/:objectifId', authenticateJWT, updateProgress);
router.get('/generateObjectiveReport/:projectId', authenticateJWT, generateObjectiveReport); // Add authenticateJWT
router.get('/typesobjectif', getObjectifTypes); // No authentication needed
router.get('/getProjectsOverview/:projectSearch', authenticateJWT, getProjectsOverview); // Add authenticateJWT

module.exports = router;