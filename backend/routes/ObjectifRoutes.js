const express = require('express');
const router = express.Router();
const { authenticateJWT } = require("../config/autorisation");
const { createObjectif,findObjectifs,markObjectifAsCompleted,markObjectifAsFailed,deleteObjectifById,updateObjectifById
    ,getAllObjectifsByProjectId,updateProgress,generateObjectiveReport } = require("../controllers/ObjectifController");
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
router.get('/typesobjectif', (req, res) => {
    try {
        const types = getAllTypeObjectif(); // Appel de la fonction pour récupérer les types
        res.status(200).json({ success: true, data: types }); // Renvoyer les types en JSON
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des types d\'objectifs', error: error.message });
    }
});
module.exports = router;