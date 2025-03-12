var express = require('express');
var router = express.Router();
const authorizeRole = require('../middleware/autorizedrole');
const { addProject,assignAccountantToProject,assignFinancialManagerToProject,assignRHManagerToProject,
    unassignAccountantFromProject,unassignFinancialManagerFromProject,unassignRHManagerFromProject,getProjectById,getMyProject
} = require("../controllers/projectController");
const { authenticateJWT } = require('../config/autorisation');

router.post("/addproject/:businessManagerId", authenticateJWT, async (req, res) => {
    try {
        console.log("Requête reçue :", req.body);

        const { businessManagerId } = req.params; // Récupérer l'ID du BusinessManager
        const projectData = req.body; // Récupérer les données du projet

        // Ajouter le token JWT à projectData
        projectData.token = req.headers.authorization?.split(" ")[1];
        console.log("Token ajouté à projectData :", projectData.token);

        // Appeler la fonction addProject
        const result = await addProject(businessManagerId, projectData);

        // Réponse réussie
        res.status(201).json(result);
    } catch (error) {
        console.error("Erreur dans la route :", error.message);
        // Gestion des erreurs
        res.status(500).json({ message: error.message });
    }
});
router.post("/assignAccountantToProject/:accountantId", authenticateJWT, assignAccountantToProject);
router.post("/assignFinancialManagerToProject/:financialManagerId", authenticateJWT, assignFinancialManagerToProject);
router.post("/assignRHManagerToProject/:rhId", authenticateJWT, assignRHManagerToProject);
router.post("/unassignaccountant/:accountantId", authenticateJWT, unassignAccountantFromProject);
router.post("/unassignfinancialmanager/:financialManagerId", authenticateJWT, unassignFinancialManagerFromProject);
router.post("/unassignrh/:rhId", authenticateJWT, unassignRHManagerFromProject);
router.get("/getProject/:id", getProjectById);
router.get("/my-project", 
    authenticateJWT, 
    authorizeRole(["BUSINESS_MANAGER"]), 
    getMyProject
  );

module.exports = router;