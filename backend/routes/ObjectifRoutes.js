const express = require('express');
const router = express.Router();
const { authenticateJWT } = require("../config/autorisation");
const { createObjectif,findObjectifs,markObjectifAsCompleted,markObjectifAsFailed,deleteObjectifById,updateObjectifById
    ,getAllObjectifsByProjectId,updateProgress,generateObjectiveReport,getObjectifTypes } = require("../controllers/ObjectifController");
    const { getAllTypeObjectif } = require('../model/Objectif');
router.post("/createobjectifs", authenticateJWT, createObjectif);
router.get("/findobjectifs", authenticateJWT, findObjectifs);
router.put("/complete/:objectifId", authenticateJWT, markObjectifAsCompleted);
router.put("/fail/:objectifId", authenticateJWT, markObjectifAsFailed);
router.delete("/deletobjectif/:objectifId", authenticateJWT, deleteObjectifById);
router.put("/updateobjectif/:objectifId", authenticateJWT, updateObjectifById);
router.get("/getAllObjectifsByProjectId/:projectId", authenticateJWT, getAllObjectifsByProjectId);
router.put('/updateProgress/:objectifId', authenticateJWT,updateProgress);
router.get('/generateObjectiveReport/:projectId', generateObjectiveReport);
router.get('/typesobjectif', getObjectifTypes);

module.exports = router;