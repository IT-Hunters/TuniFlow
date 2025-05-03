var express = require('express');
var router = express.Router();
const authorizeRole = require('../middleware/autorizedrole');
const { addProject,assignAccountantToProject,assignFinancialManagerToProject,assignRHManagerToProject,
    unassignAccountantFromProject,unassignFinancialManagerFromProject,unassignRHManagerFromProject,getProjectById,getMyProject,
    getbyid,getAllAccountantsofproject,getAllHRsOfProject,getAllFinancialManagersOfProject,updateproject,getProjectByUserId,
    deleteProjectById,generateProjectReport,generateProjectReportbyid,generateProjectsReportowner,getAssignedUsersToProject,
} = require("../controllers/projectController");
const {createNotification,getUserNotifications,markNotificationAsRead} =require("../controllers/NotificationController")
const { authenticateJWT } = require('../config/autorisation');

// Routes de notification
router.post('/notifications', authenticateJWT, async (req, res) => {
    try {
        const { userId, message, projectId } = req.body;
        const notification = await createNotification(userId, message, projectId);
        
        // Émettre la notification via Socket.IO
        if (global.io) {
            global.io.emit(`notification:${userId}`, notification);
        }
        
        res.status(201).json(notification);
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/notifications', authenticateJWT, getUserNotifications);


router.put('/notifications/:notificationId/mark-as-read', authenticateJWT, markNotificationAsRead);
router.get('/:projectId/assigned-users', getAssignedUsersToProject);

router.get("/getAllAccountantsofproject",authenticateJWT,getAllAccountantsofproject)
router.get("/getAllHRsOfProject",authenticateJWT,getAllHRsOfProject)
router.get("/getAllFinancialManagersOfProject",authenticateJWT,getAllFinancialManagersOfProject)
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
router.get("/generate-report", async (req, res) => {
    await generateProjectReport(res);
});
router.get('/generatereportowner', authenticateJWT, generateProjectsReportowner);
router.get("/generate-report/:projectId", generateProjectReportbyid);
router.post("/assignAccountantToProject/:accountantId", authenticateJWT, assignAccountantToProject);
router.post("/assignFinancialManagerToProject/:financialManagerId", authenticateJWT, assignFinancialManagerToProject);
router.post("/assignRHManagerToProject/:rhId", authenticateJWT, assignRHManagerToProject);
router.post("/unassignaccountant/:accountantId", authenticateJWT, unassignAccountantFromProject);
router.post("/unassignfinancialmanager/:financialManagerId", authenticateJWT, unassignFinancialManagerFromProject);
router.post("/unassignrh/:rhId", authenticateJWT, unassignRHManagerFromProject);
router.get("/getProject/:id", getProjectById);
router.get("/getProjectByUser/:userId", getProjectByUserId);
router.delete("/deleteProjectById/:id", deleteProjectById);
router.put("/updateproject/:id", updateproject);
router.get("/my-project", 
    authenticateJWT, 
    authorizeRole(["BUSINESS_MANAGER"]), 
    getMyProject
  );
  router.get("/getbyid/:id", getbyid);
module.exports = router;