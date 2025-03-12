var express = require('express');
var router = express.Router();
const { addProject,assignAccountantToProject,assignFinancialManagerToProject,assignRHManagerToProject } = require("../controllers/projectController");
const { authenticateJWT } = require('../config/autorisation');

router.post("/addproject/:businessManagerName", authenticateJWT, async (req, res) => {
    try {
        console.log("Requête reçue :", req.body);

        const { businessManagerName } = req.params; // Récupérer le nom ou l'ID du BusinessManager
        const projectData = req.body; // Récupérer les données du projet

        // Ajouter le token JWT à projectData
        projectData.token = req.headers.authorization?.split(" ")[1];
        console.log("Token ajouté à projectData :", projectData.token);

        // Appeler la fonction addProject
        const result = await addProject(businessManagerName, projectData);

        // Réponse réussie
        res.status(201).json(result);
    } catch (error) {
        console.error("Erreur dans la route :", error.message);
        // Gestion des erreurs
        res.status(500).json({ message: error.message });
    }
});
router.post("/assignAccountantToProject/:projectId/:accountantId", async (req, res) => {
    try {
        const { projectId, accountantId } = req.params;
        const result = await assignAccountantToProject(projectId, accountantId);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post("/assignFinancialManagerToProject/:projectId/:financialManagerId", async (req, res) => {
    try {
        const { projectId, financialManagerId } = req.params;
        const result = await assignFinancialManagerToProject(projectId, financialManagerId);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Route pour assigner un RH Manager à un projet
router.post("/assignRHManagerToProject/:projectId/:rhId", async (req, res) => {
    try {
        const { projectId, rhId } = req.params;
        const result = await assignRHManagerToProject(projectId, rhId);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;