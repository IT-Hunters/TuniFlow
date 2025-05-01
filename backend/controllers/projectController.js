const bcryptjs = require("bcryptjs");
const userModel = require("../model/user");
const validateRegister = require("../validation/registerValidation");
const validateLogin = require("../validation/login.validator");
const mongoose = require("mongoose");
require('dotenv').config();
const jwt = require("jsonwebtoken");
// Import des modèles discriminants
const FinancialManager = require("../model/FinancialManager");
const BusinessOwner = require("../model/BusinessOwner");
const Accountant = require("../model/Accountant");
const taxe=require("../model/TaxeModels/Taxes")
const { getBusinessOwnerFromToken } = require("./auth");
const RH = require("../model/RH");
const assets_actif=require("../model/AssetActif/AssetActif")
const ProjectConversation=require("../model/ProjectConversation")
const Project = require("../model/Project");
const BusinessManager = require("../model/BusinessManager");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const Wallet =require("../model/wallet")
const { createNotification } = require("../controllers/NotificationController")
// Assurez-vous que le chemin est correct


async function addProject(businessManagerId, projectData) {
    try {
        console.log("Starting addProject function");

        // Récupérer le token
        const token = projectData.token;
        if (!token) {
            throw new Error("Token missing");
        }
        console.log("Token retrieved:", token);

        // Récupérer le BusinessOwner à partir du token
        const businessOwner = await getBusinessOwnerFromToken(token);
        console.log("BusinessOwner retrieved:", businessOwner);

        // Trouver le BusinessManager par ID
        const manager = await BusinessManager.findById(businessManagerId);
        if (!manager) {
            throw new Error("BusinessManager not found");
        }
        console.log("BusinessManager retrieved:", manager);

        // Vérifier si le BusinessManager a déjà un projet
        if (manager.project) {
            throw new Error("This BusinessManager already has an assigned project");
        }
        console.log("BusinessManager has no assigned project");

        // ✅ Créer un Wallet
        const wallet = new Wallet({ type: "default", user_id: businessOwner._id });
        await wallet.save();
        console.log("Wallet created:", wallet);

        // ✅ Créer un nouveau projet
        const project = new Project({
            status: projectData.status,
            due_date: projectData.due_date,
            businessManager: manager._id,
            businessOwner: businessOwner._id,
            accountants: projectData.accountants,
            financialManagers: projectData.financialManagers,
            rhManagers: projectData.rhManagers,
            wallet: wallet._id,
        });
        console.log("Project created:", project);

        await project.save();
        console.log("Project saved");

        // Associer le projet au BusinessManager
        manager.project = project._id;
        await manager.save();
        console.log("Project associated with BusinessManager");

        // Ajouter le projet à la liste du BusinessOwner
        businessOwner.projects.push(project._id);
        await businessOwner.save();
        console.log("Project added to BusinessOwner's project list");

        // ✅ ✅ Créer une notification pour le BusinessManager
        const message = `Un nouveau projet vous a été assigné : ${project._id}`;
        const notification = await createNotification(manager._id, message, project._id);

        // ✅ ✅ Émettre la notification via Socket.IO en temps réel
        if (global.io) {
            global.io.to(manager._id.toString()).emit("newNotification", notification);
            console.log("✅ Notification envoyée au BusinessManager via Socket.IO");
        }

        return { message: "Project created and linked to BusinessManager", project };
    } catch (error) {
        console.error("Error in addProject:", error.message);
        throw error;
    }
}



async function assignAccountantToProject(req, res) {
    try {
        const accountantId = req.params.accountantId;
        const userId = req.user.userId; // ID de l'utilisateur connecté

        // Vérifier si l'utilisateur a un projet associé
        const user = await userModel.findById(userId);
        if (!user || !user.project || user.project.length === 0) {
            return res.status(404).json({ message: "No project found for this user" });
        }

        const projectId = user.project;
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: "No project found for this user" });
        }

        // Vérifier si le comptable existe
        const accountant = await Accountant.findById(accountantId);
        if (!accountant) {
            return res.status(404).json({ message: "Accountant not found" });
        }

        if (accountant.project) {
            return res.status(400).json({ message: "This accountant is already assigned to a project" });
        }

        // Assigner le comptable au projet
        project.accountants.push(accountant._id);
        await project.save();

        accountant.project = project._id;
        await accountant.save();

        // 🎯 Créer une notification pour informer le comptable
        const message = `Vous avez été affecté au projet ${project.name || project._id}`;
        await createNotification(accountant._id, message, project._id);

        // 🎯 Émettre l'événement Socket.IO aussi pour le comptable
        if (global.io) {
            global.io.to(accountant._id.toString()).emit("newNotification", {
                message,
                projectId: project._id,
                timestamp: new Date()
            });
        }

        // Changement : Ajouter le comptable à la conversation du projet
        const conversation = await ProjectConversation.findOne({ projectId });
        if (conversation) {
            // Ajouter l'ID du comptable à la liste des participants (évite les doublons avec $addToSet)
            conversation.participants.addToSet(accountant._id);
            await conversation.save();
        } else {
            console.log(`Aucune conversation trouvée pour le projet ${projectId}.`);
        }

        return res.status(200).json({ message: "Accountant assigned to project successfully", project });
    } catch (error) {
        console.error("Error during assignment:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function getbyid(req, res) {
    try {
        const data = await Project.findById(req.params.id)
            .populate('businessManager', 'fullname email') // Peuple le businessManager avec seulement fullname et email
            .populate('accountants', 'fullname email')    // Peuple les accountants
            .populate('financialManagers', 'fullname email') // Peuple les financialManagers
            .populate('businessOwner', 'fullname email')    // Peuple le businessOwner
            .populate('rhManagers', 'fullname email')      // Peuple les rhManagers
            .populate('taxes')                             // Peuple toutes les taxes
            .populate('assets_actif')                      // Peuple tous les assets_actif
            .exec();

        if (!data) {
            return res.status(404).send({ message: "Project not found" });
        }

        res.send(data);
    } catch (err) {
        console.error("Error fetching project:", err);
        res.status(500).send({ message: "Server error", error: err.message });
    }
}
async function assignFinancialManagerToProject(req, res) {
    try {
        const financialManagerId = req.params.financialManagerId;
        const userId = req.user.userId;

        const user = await userModel.findById(userId);
        if (!user || !user.project || user.project.length === 0) {
            return res.status(404).json({ message: "No project found for this user" });
        }

        const projectId = user.project;
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const financialManager = await FinancialManager.findById(financialManagerId);
        if (!financialManager) {
            return res.status(404).json({ message: "Financial Manager not found" });
        }

        if (financialManager.project) {
            return res.status(400).json({ message: "This Financial Manager is already assigned to a project" });
        }

        project.financialManagers.push(financialManager._id);
        await project.save();

        financialManager.project = project._id;
        await financialManager.save();

        // 🎯 Créer une notification pour informer le gestionnaire financier
        const message = `Vous avez été affecté au projet ${project.name || project._id}`;
        await createNotification(financialManager._id, message, project._id);

        // 🎯 Émettre l'événement Socket.IO aussi pour le gestionnaire financier
        if (global.io) {
            global.io.to(financialManager._id.toString()).emit("newNotification", {
                message,
                projectId: project._id,
                timestamp: new Date()
            });
        }

        // Changement : Ajouter le gestionnaire financier à la conversation du projet
        const conversation = await ProjectConversation.findOne({ projectId });
        if (conversation) {
            // Ajouter l'ID du gestionnaire financier à la liste des participants (évite les doublons avec $addToSet)
            conversation.participants.addToSet(financialManager._id);
            await conversation.save();
        } else {
            console.log(`Aucune conversation trouvée pour le projet ${projectId}.`);
        }

        return res.status(200).json({ message: "Financial Manager assigned to project successfully", project });
    } catch (error) {
        console.error("Error during assignment:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function assignRHManagerToProject(req, res) {
    try {
        const rhId = req.params.rhId;
        const userId = req.user.userId;

        const user = await userModel.findById(userId);
        if (!user || !user.project || user.project.length === 0) {
            return res.status(404).json({ message: "No project found for this user" });
        }

        const projectId = user.project;
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const rh = await RH.findById(rhId);
        if (!rh) {
            return res.status(404).json({ message: "RH Manager not found" });
        }

        if (rh.project) {
            return res.status(400).json({ message: "This RH Manager is already assigned to a project" });
        }

        project.rhManagers.push(rh._id);
        await project.save();

        rh.project = project._id;
        await rh.save();

        // 🎯 Créer une notification pour informer le gestionnaire RH
        const message = `Vous avez été affecté au projet ${project.name || project._id}`;
        await createNotification(rh._id, message, project._id);

        // 🎯 Émettre l'événement Socket.IO aussi pour le gestionnaire RH
        if (global.io) {
            global.io.to(rh._id.toString()).emit("newNotification", {
                message,
                projectId: project._id,
                timestamp: new Date()
            });
        }

        // Changement : Ajouter le gestionnaire RH à la conversation du projet
        const conversation = await ProjectConversation.findOne({ projectId });
        if (conversation) {
            // Ajouter l'ID du gestionnaire RH à la liste des participants (évite les doublons avec $addToSet)
            conversation.participants.addToSet(rh._id);
            await conversation.save();
        } else {
            console.log(`Aucune conversation trouvée pour le projet ${projectId}.`);
        }

        return res.status(200).json({ message: "RH Manager assigned to project successfully", project });
    } catch (error) {
        console.error("Error during assignment:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function unassignAccountantFromProject(req, res) {
    try {
        const accountantId = req.params.accountantId;
        const userId = req.user.userId;

        const user = await userModel.findById(userId);
        if (!user || !user.project || user.project.length === 0) {
            return res.status(404).json({ message: "No project found for this user" });
        }

        const projectId = user.project;
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const accountant = await Accountant.findById(accountantId);
        if (!accountant) {
            return res.status(404).json({ message: "Accountant not found" });
        }

        if (!accountant.project || accountant.project.toString() !== project._id.toString()) {
            return res.status(400).json({ message: "This accountant is not assigned to this project" });
        }

        // Remove the assignment
        project.accountants = project.accountants.filter(id => id.toString() !== accountantId);
        await project.save();

        accountant.project = null;
        await accountant.save();

        // ✅ Créer une notification
        const message = `Vous avez été retiré du projet ${project.name || project._id}`;
        await createNotification(accountant._id, message, project._id);

        // ✅ Émettre la notification via Socket.IO
        if (global.io) {
            global.io.to(accountant._id.toString()).emit("newNotification", {
                message,
                projectId: project._id,
                timestamp: new Date()
            });
        }

        // Changement : Retirer le comptable de la liste des participants de la conversation
        const conversation = await ProjectConversation.findOne({ projectId });
        if (conversation) {
            // Retirer l'ID du comptable de la liste des participants
            conversation.participants.pull(accountant._id);
            await conversation.save();
        } else {
            console.log(`Aucune conversation trouvée pour le projet ${projectId}.`);
        }

        return res.status(200).json({ message: "Accountant removed from project successfully", project });
    } catch (error) {
        console.error("Error during unassignment:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function unassignFinancialManagerFromProject(req, res) {
    try {
        const financialManagerId = req.params.financialManagerId;
        const userId = req.user.userId;

        const user = await userModel.findById(userId);
        if (!user || !user.project || user.project.length === 0) {
            return res.status(404).json({ message: "No project found for this user" });
        }

        const projectId = user.project;
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const financialManager = await FinancialManager.findById(financialManagerId);
        if (!financialManager) {
            return res.status(404).json({ message: "Financial Manager not found" });
        }

        if (!financialManager.project || financialManager.project.toString() !== project._id.toString()) {
            return res.status(400).json({ message: "This Financial Manager is not assigned to this project" });
        }

        // Remove the assignment
        project.financialManagers = project.financialManagers.filter(id => id.toString() !== financialManagerId);
        await project.save();

        financialManager.project = null;
        await financialManager.save();

        // ✅ Créer une notification
        const message = `Vous avez été retiré du projet ${project.name || project._id}`;
        await createNotification(financialManager._id, message, project._id);

        // ✅ Émettre la notification via Socket.IO
        if (global.io) {
            global.io.to(financialManager._id.toString()).emit("newNotification", {
                message,
                projectId: project._id,
                timestamp: new Date()
            });
        }

        // Changement : Retirer le gestionnaire financier de la liste des participants de la conversation
        const conversation = await ProjectConversation.findOne({ projectId });
        if (conversation) {
            // Retirer l'ID du gestionnaire financier de la liste des participants
            conversation.participants.pull(financialManager._id);
            await conversation.save();
        } else {
            console.log(`Aucune conversation trouvée pour le projet ${projectId}.`);
        }

        return res.status(200).json({ message: "Financial Manager removed from project successfully", project });
    } catch (error) {
        console.error("Error during unassignment:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function unassignRHManagerFromProject(req, res) {
    try {
        const rhId = req.params.rhId;
        const userId = req.user.userId;

        const user = await userModel.findById(userId);
        if (!user || !user.project || user.project.length === 0) {
            return res.status(404).json({ message: "No project found for this user" });
        }

        const projectId = user.project;
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const rh = await RH.findById(rhId);
        if (!rh) {
            return res.status(404).json({ message: "RH Manager not found" });
        }

        if (!rh.project || rh.project.toString() !== project._id.toString()) {
            return res.status(400).json({ message: "This RH Manager is not assigned to this project" });
        }

        // Remove the assignment
        project.rhManagers = project.rhManagers.filter(id => id.toString() !== rhId);
        await project.save();

        rh.project = null;
        await rh.save();

        // ✅ Créer une notification
        const message = `Vous avez été retiré du projet ${project.name || project._id}`;
        await createNotification(rh._id, message, project._id);

        // ✅ Émettre la notification via Socket.IO
        if (global.io) {
            global.io.to(rh._id.toString()).emit("newNotification", {
                message,
                projectId: project._id,
                timestamp: new Date()
            });
        }

        // Changement : Retirer le gestionnaire RH de la liste des participants de la conversation
        const conversation = await ProjectConversation.findOne({ projectId });
        if (conversation) {
            // Retirer l'ID du gestionnaire RH de la liste des participants
            conversation.participants.pull(rh._id);
            await conversation.save();
        } else {
            console.log(`Aucune conversation trouvée pour le projet ${projectId}.`);
        }

        return res.status(200).json({ message: "RH Manager removed from project successfully", project });
    } catch (error) {
        console.error("Error during unassignment:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}


// Dans votre controller (backend)
const getProjectById = async (req, res) => {
    try {
      const project = await Project.findById(req.params.id)
        .populate('objectifs') // Peuple les objectifs complets
        .exec();
      
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
  
      res.status(200).json(project);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

async function getMyProject(req, res) {
    try {
        const project = await Project.findOne({ businessManager: req.user.userId })
            .populate('businessOwner', 'fullname lastname');
        if (!project) {
            return res.status(404).json({ message: "Project not found for this Business Manager" });
        }
        res.status(200).json(project);
    } catch (error) {
        console.error("Error retrieving project:", error);
        res.status(500).json({ message: "Server error", error });
    }
}
const getAllAccountantsofproject = async (req, res) => {
    try {
        // Récupérer l'ID du Business Manager connecté
        const userId = req.user.userId;

        // Trouver le projet associé
        const project = await Project.findOne({ businessManager: userId }).populate("accountants");

        console.log("Projet trouvé :", project); // Vérifier si un projet est trouvé

        // Comptables liés au projet
        const projectAccountants = project ? project.accountants : [];

        console.log("Comptables liés au projet :", projectAccountants);

        // Comptables qui n'ont pas de projet (ajouter null et undefined pour éviter les erreurs)
        const accountantsWithoutProject = await userModel.find({ 
            role: "ACCOUNTANT", 
            $or: [{ project: { $exists: false } }, { project: null }]
        });

        console.log("Comptables sans projet :", accountantsWithoutProject);

        // Fusionner les deux listes
        const allAccountants = [...projectAccountants, ...accountantsWithoutProject];

        return res.status(200).json({ accountants: allAccountants });
    } catch (error) {
        console.error("Erreur lors de la récupération des comptables :", error);
        return res.status(500).json({ message: "Erreur serveur" });
    }
};
const getAllHRsOfProject = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Récupérer le projet associé
        const project = await Project.findOne({ businessManager: userId }).populate("rhManagers");

        const projectHRs = project ? project.rhManagers : [];

        // Récupérer les HRs qui n'ont pas de projet
        const hrsWithoutProject = await userModel.find({ 
            role: "RH", 
            $or: [{ project: { $exists: false } }, { project: null }]
        });

        // Fusionner les deux listes
        const rhManagers = [...projectHRs, ...hrsWithoutProject];

        return res.status(200).json({ rhManagers: rhManagers });
    } catch (error) {
        console.error("Erreur lors de la récupération des HRs :", error);
        return res.status(500).json({ message: "Erreur serveur" });
    }
};
const getAllFinancialManagersOfProject = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Récupérer le projet associé
        const project = await Project.findOne({ businessManager: userId }).populate("financialManagers");

        const projectFinancialManagers = project ? project.financialManagers : [];

        // Récupérer les Financial Managers qui n'ont pas de projet
        const financialManagersWithoutProject = await userModel.find({ 
            role: "FINANCIAL_MANAGER", 
            $or: [{ project: { $exists: false } }, { project: null }]
        });

        // Fusionner les deux listes
        const allFinancialManagers = [...projectFinancialManagers, ...financialManagersWithoutProject];

        return res.status(200).json({ financialManagers: allFinancialManagers });
    } catch (error) {
        console.error("Erreur lors de la récupération des Financial Managers :", error);
        return res.status(500).json({ message: "Erreur serveur" });
    }
};
const updateproject = async (req, res) => {
    const projectID = req.params.id;
    // Récupérer les nouveaux champs du contact à partir du body de la requête
  
    try {
      // Recherche du contact à modifier et mise à jour
      const updatedproject = await Project.findByIdAndUpdate(projectID, req.body, { new: true });
  
      if (!updatedproject) {
        return res.status(404).json({ message: 'pays non trouvé' });
      }
  
      res.status(200).json({ message: 'project mis à jour avec succès', project: updatedproject });
    } catch (err) {
      console.error('Erreur lors de la mise à jour du project:', err);
      res.status(500).json({ message: 'Erreur interne', error: err });
    }
  };
  
  const deleteProjectById = async (req, res) => {
    try {
        const { id: projectId } = req.params;

        // 1. Vérifier l'existence du projet
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: "Projet non trouvé" });
        }

        // 2. Désaffectation des utilisateurs (en parallèle)
        await Promise.all([
            // Désaffectation des managers
            BusinessManager.updateOne({ _id: project.businessManager }, { $unset: { project: "" } }),
            BusinessOwner.updateOne({ _id: project.businessOwner }, { $unset: { project: "" } }),
            
            // Retrait des références dans les tableaux
            Accountant.updateMany({ _id: { $in: project.accountants } }, { $pull: { projects: projectId } }),
            FinancialManager.updateMany({ _id: { $in: project.financialManagers } }, { $pull: { projects: projectId } }),
            RH.updateMany({ _id: { $in: project.rhManagers } }, { $pull: { projects: projectId } })
        ]);

        // 3. Nettoyage des taxes (deux options au choix)
        // OPTION A: Désassociation
        await taxe.updateMany({ projet: projectId }, { $unset: { projet: "" } });
        
        // OPTION B: Suppression (décommentez si nécessaire)
        // await Taxes.deleteMany({ projet: projectId });

        // 4. Gestion des assets_actif (deux options)
        // OPTION A: Désassociation
        await assets_actif.updateMany({ _id: { $in: project.assets_actif } }, { $unset: { projet_id: "" } });
        
        // OPTION B: Suppression (décommentez si nécessaire)
        // await AssetActif.deleteMany({ _id: { $in: project.assets_actif } });

        // 5. Suppression finale du projet
        await Project.findByIdAndDelete(projectId);

        res.status(200).json({ 
            success: true,
            message: "Projet supprimé avec nettoyage complet des références",
            details: {
                project: projectId,
                taxes_processed: true,
                assets_processed: true,
                users_updated: true
            }
        });

    } catch (error) {
        console.error("[ERREUR] Suppression projet:", error);
        res.status(500).json({
            success: false,
            message: "Échec de la suppression du projet",
            error: process.env.NODE_ENV === 'development' ? {
                message: error.message,
                stack: error.stack
            } : undefined
        });
    }
};
const generateProjectReport = async (res) => {
    try {
        // Vérifie si le dossier "reports" existe, sinon le créer
        const reportsDir = "./reports";
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir);
        }

        const projects = await Project.find()
            
            .populate("businessManager", "fullname")
            .populate("businessOwner", "fullname")
            .populate("employees", "name")
            .populate("financialManagers", "fullname")
            .populate("accountants", "fullname")
            .populate("rhManagers", "fullname");

        const doc = new PDFDocument();
        const fileName = `project-report-${Date.now()}.pdf`;
        const filePath = `${reportsDir}/${fileName}`;
        const stream = fs.createWriteStream(filePath);

        doc.pipe(stream);
        doc.fontSize(18).text("Rapport des Projets", { align: "center" });
        doc.moveDown(2);

        projects.forEach((project, index) => {
            doc.fontSize(14).text(`Projet #${index + 1}`);
            doc.fontSize(12).text(`- Statut : ${project.status}`);
            doc.text(`- Montant : ${project.amount || "N/A"} €`);
            doc.text(`- Date d'échéance : ${project.due_date.toDateString()}`);
            doc.text(`- Manager : ${project.businessManager?.fullname || "Non Assigné"}`);
            doc.text(`- Owner : ${project.businessOwner?.fullname || "Non Assigné"}`);
            doc.text(`- Financial Managers : ${project.financialManagers.map(fm => fm.fullname).join(", ") || "Aucun financier"}`);
            doc.text(`- Accountants : ${project.accountants.map(acc => acc.fullname).join(", ") || "Aucun account"}`);
            doc.text(`- RH Managers : ${project.rhManagers.map(rh => rh.fullname).join(", ") || "Aucun rh manager"}`);
            doc.text(`- Employés : ${project.employees.map(e => e.name).join(", ") || "Aucun employé"}`);
            doc.moveDown(1);
        });

        doc.end();

        stream.on("finish", () => {
            res.download(filePath);
        });

    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la génération du rapport", error });
    }
};
const generateProjectReportbyid = async (req, res) => {
    try {
        const { projectId } = req.params;

        // Récupérer le projet avec toutes les données nécessaires
        const project = await Project.findById(projectId)
            .populate("businessManager", "fullname lastname email")
            .populate("businessOwner", "fullname lastname email")
            .populate("employees", "name email")
            .populate("financialManagers", "fullname lastname email")
            .populate("accountants", "fullname lastname email")
            .populate("rhManagers", "fullname lastname email")
            .populate("assets_actif", "name total_value date_acquisition type_actif")
            .populate("taxes", "nom_taxe taux description categorie date_effet")
            .populate("objectifs");
            

        if (!project) {
            return res.status(404).json({ message: "Projet non trouvé" });
        }

        const doc = new PDFDocument({ margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="rapport_projet_${projectId}.pdf"`);
        doc.pipe(res);

        // Styles
        const styles = {
            title: { fontSize: 16, align: 'center', font: 'Helvetica-Bold' },
            sectionTitle: { fontSize: 14, font: 'Helvetica-Bold' },
            tableHeader: { fontSize: 12, font: 'Helvetica-Bold', fillColor: '#f0f0f0' },
            tableCell: { fontSize: 12, font: 'Helvetica' },
            teamMember: { fontSize: 12, font: 'Helvetica', indent: 20 }
        };

        // Fonction pour dessiner un tableau
        const drawTable = (headers, rows, columnWidths, startY) => {
            const rowHeight = 20;
            let x = 50;

            // En-têtes
            headers.forEach((header, i) => {
                doc.rect(x, startY, columnWidths[i], rowHeight)
                   .fillAndStroke(styles.tableHeader.fillColor, '#333');
                doc.fillColor('#000')
                   .text(header, x + 5, startY + 5, { width: columnWidths[i] - 10 });
                x += columnWidths[i];
            });

            // Données
            rows.forEach((row, rowIndex) => {
                x = 50;
                row.forEach((cell, colIndex) => {
                    doc.rect(x, startY + (rowIndex + 1) * rowHeight, columnWidths[colIndex], rowHeight)
                       .stroke('#ddd');
                    doc.text(cell, x + 5, startY + (rowIndex + 1) * rowHeight + 5, { 
                        width: columnWidths[colIndex] - 10,
                        ...styles.tableCell
                    });
                    x += columnWidths[colIndex];
                });
            });

            return startY + (rows.length + 1) * rowHeight + 10;
        };

        // Titre principal
        doc.text(`Rapport détaillé du projet: ${project.name || project._id}`, styles.title);
        doc.moveDown(2);

        // Section Informations de base
        doc.text('Informations Générales', styles.sectionTitle);
        doc.moveDown(0.5);
        
        const baseInfo = [
            `ID: ${project._id}`,
            `Statut: ${project.status || 'Non spécifié'}`,
            `Budget: ${project.amount ? `${project.amount} €` : 'Non spécifié'}`,
            `Date d'échéance: ${project.due_date ? new Date(project.due_date).toLocaleDateString('fr-FR') : 'N/A'}`
        ];
        
        baseInfo.forEach(info => doc.text(info, styles.tableCell));
        doc.moveDown(1);

        // Section Équipe
        doc.text('Équipe du Projet', styles.sectionTitle);
        doc.moveDown(0.5);
        
        doc.text(`Propriétaire: ${project.businessOwner?.fullname || 'Non assigné'} ${project.businessOwner?.lastname || ''} (${project.businessOwner?.email || 'N/A'})`, styles.teamMember);
        doc.text(`Manager: ${project.businessManager?.fullname || 'Non assigné'} ${project.businessManager?.lastname || ''} (${project.businessManager?.email || 'N/A'})`, styles.teamMember);
        
        // Comptables
        doc.text('Comptables:', { ...styles.teamMember, font: 'Helvetica-Bold' });
        project.accountants?.length > 0 
            ? project.accountants.forEach(acc => 
                doc.text(`- ${acc.fullname} ${acc.lastname || ''} (${acc.email || 'N/A'})`, styles.teamMember))
            : doc.text('- Aucun comptable assigné', styles.teamMember);
        
        // Responsables Financiers
        doc.text('Responsables Financiers:', { ...styles.teamMember, font: 'Helvetica-Bold' });
        project.financialManagers?.length > 0 
            ? project.financialManagers.forEach(fm => 
                doc.text(`- ${fm.fullname} ${fm.lastname || ''} (${fm.email || 'N/A'})`, styles.teamMember))
            : doc.text('- Aucun responsable financier', styles.teamMember);
        
        // Responsables RH
        doc.text('Responsables RH:', { ...styles.teamMember, font: 'Helvetica-Bold' });
        project.rhManagers?.length > 0 
            ? project.rhManagers.forEach(rh => 
                doc.text(`- ${rh.fullname} ${rh.lastname || ''} (${rh.email || 'N/A'})`, styles.teamMember))
            : doc.text('- Aucun responsable RH', styles.teamMember);
        
        doc.moveDown(1.5);

        // Assets Actif
        doc.text('Assets Actif', styles.sectionTitle);
        doc.moveDown(0.5);

        if (project.assets_actif?.length > 0) {
            const assetHeaders = ['Nom', 'Valeur', 'Date Acquisition', 'Type'];
            const assetWidths = [180, 80, 100, 120];
            const assetRows = project.assets_actif.map(asset => [
                asset.name || 'N/A',
                asset.total_value ? `${asset.total_value} €` : 'N/A',
                asset.date_acquisition ? new Date(asset.date_acquisition).toLocaleDateString('fr-FR') : 'N/A',
                asset.type_actif || 'N/A'
            ]);

            doc.y = drawTable(assetHeaders, assetRows, assetWidths, doc.y);
        } else {
            doc.text('Aucun asset actif', styles.tableCell);
        }
        doc.moveDown(1.5);

        // Taxes
        doc.text('Taxes', styles.sectionTitle);
        doc.moveDown(0.5);

        if (project.taxes?.length > 0) {
            const taxHeaders = ['Nom Taxe', 'Taux', 'Catégorie', 'Date Effet', 'Description'];
            const taxWidths = [100, 50, 100, 80, 170]; // Ajustement pour bien afficher la description
            const taxRows = project.taxes.map(tax => [
                tax.nom_taxe || 'N/A',
                tax.taux ? `${tax.taux}%` : 'N/A',
                tax.categorie || 'N/A',
                tax.date_effet ? new Date(tax.date_effet).toLocaleDateString('fr-FR') : 'N/A',
                tax.description || 'Aucune description'
            ]);

            doc.y = drawTable(taxHeaders, taxRows, taxWidths, doc.y);
        } else {
            doc.text('Aucune taxe associée', styles.tableCell);
        }

// Objectifs du projet
doc.moveDown(1.5);
doc.text("Objectifs du projet", styles.sectionTitle);
doc.moveDown(0.5);

// Vérifier la présence d’objectifs
if (project.objectifs?.length > 0) {
    const objectifHeaders = ["Nom", "Type", "Statut", "Montant cible", "Budget min", "Budget max", "Début", "Fin", "Progress"];
    const objectifWidths = [80, 60, 70, 100, 80, 80, 60, 60, 60]; // ✅ Colonnes ajustées

    const objectifRows = [];

    project.objectifs.forEach(obj => {
        // ✅ Première ligne avec certaines infos
        objectifRows.push([
            obj.name || "N/A",
            obj.objectivetype || "N/A",
            obj.status || "N/A",
            obj.target_amount ? `${obj.target_amount} €` : "N/A",
            obj.minbudget ? `${obj.minbudget} €` : "N/A",
            obj.maxbudget ? `${obj.maxbudget} €` : "N/A",
            obj.datedebut ? new Date(obj.datedebut).toLocaleDateString("fr-FR") : "N/A",
            obj.datefin ? new Date(obj.datefin).toLocaleDateString("fr-FR") : "N/A",
            `${obj.progress}%`
        ]);

        // ✅ Deuxième ligne avec infos complémentaires (ou vide pour format 2 lignes)
        objectifRows.push([
            "", // Deuxième ligne vide sous "Nom"
            obj.objectivetype_detail || "", // Détail du type
            "", // Statut reste vide
            "", // Montant cible vide
            "", // Budget min vide
            "", // Budget max vide
            "", // Début vide
            "", // Fin vide
            ""  // Progress vide
        ]);
    });

    // ✅ Activer le mode paysage si trop large
    if (doc.page.width < 700) {
        doc.addPage({ layout: 'landscape' });
    }

    doc.y = drawTable(objectifHeaders, objectifRows, objectifWidths, doc.y);
} else {
    doc.text("Aucun objectif associé à ce projet", styles.tableCell);
}





        doc.end();
    } catch (error) {
        console.error("Erreur génération rapport:", error);
        res.status(500).json({ 
            message: "Erreur lors de la génération du rapport",
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};
const generateProjectsReportowner = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Peuplement complet des données avec les objectifs
        const user = await userModel.findById(userId).populate({
            path: 'projects',
            populate: [
                { path: 'taxes', select: 'nom_taxe taux description categorie date_effet' },
                { path: 'assets_actif', select: 'name total_value date_acquisition type_actif' },
                { path: 'objectifs', select: 'name description target_amount minbudget maxbudget datedebut datefin progress status objectivetype' },
                { path: 'businessOwner', select: 'fullname email' },
                { path: 'businessManager', select: 'fullname email' },
                { path: 'accountants', select: 'fullname email' },
                { path: 'financialManagers', select: 'fullname email' },
                { path: 'rhManagers', select: 'fullname email' }
            ]
        });

        if (!user?.projects?.length) {
            return res.status(404).json({ message: 'Aucun projet trouvé' });
        }

        const doc = new PDFDocument({ margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="rapport_complet.pdf"');
        doc.pipe(res);

        // Styles
        const styles = {
            title: { fontSize: 16, align: 'center', font: 'Helvetica-Bold' },
            sectionTitle: { fontSize: 14, font: 'Helvetica-Bold' },
            tableHeader: { fontSize: 12, font: 'Helvetica-Bold', fillColor: '#f0f0f0' },
            tableCell: { fontSize: 12, font: 'Helvetica' },
            teamMember: { fontSize: 12, font: 'Helvetica', indent: 20 },
            progressBar: { width: 100, height: 10 }
        };

        // Fonction pour dessiner un tableau
        const drawTable = (headers, rows, columnWidths, startY) => {
            const rowHeight = 20;
            let x = 50;

            // En-têtes
            headers.forEach((header, i) => {
                doc.rect(x, startY, columnWidths[i], rowHeight)
                   .fillAndStroke(styles.tableHeader.fillColor, '#333');
                doc.fillColor('#000')
                   .text(header, x + 5, startY + 5, { width: columnWidths[i] - 10 });
                x += columnWidths[i];
            });

            // Données
            rows.forEach((row, rowIndex) => {
                x = 50;
                row.forEach((cell, colIndex) => {
                    doc.rect(x, startY + (rowIndex + 1) * rowHeight, columnWidths[colIndex], rowHeight)
                       .stroke('#ddd');
                    doc.text(cell, x + 5, startY + (rowIndex + 1) * rowHeight + 5, { 
                        width: columnWidths[colIndex] - 10,
                        ...styles.tableCell
                    });
                    x += columnWidths[colIndex];
                });
            });

            return startY + (rows.length + 1) * rowHeight + 10;
        };

        // Fonction pour dessiner une barre de progression
        const drawProgressBar = (doc, x, y, width, height, progress) => {
            const filledWidth = (width * progress) / 100;
            
            // Fond de la barre
            doc.rect(x, y, width, height)
               .fillAndStroke('#e0e0e0', '#333');
            
            // Partie remplie
            doc.rect(x, y, filledWidth, height)
               .fillAndStroke('#4CAF50');
            
            return y + height + 5;
        };

        user.projects.forEach((project, index) => {
            if (index > 0) doc.addPage();

            // Titre
            doc.text(`Rapport détaillé du projet: ${project.name || project._id}`, styles.title);
            doc.moveDown(2);

            // Section Informations de base
            doc.text('Informations Générales', styles.sectionTitle);
            doc.moveDown(0.5);
            
            const baseInfo = [
                `ID: ${project._id}`,
                `Statut: ${project.status || 'Non spécifié'}`,
                `Budget: ${project.amount ? `${project.amount} €` : 'Non spécifié'}`,
                `Date de début: ${project.startDate ? new Date(project.startDate).toLocaleDateString('fr-FR') : 'N/A'}`,
                `Date de fin: ${project.endDate ? new Date(project.endDate).toLocaleDateString('fr-FR') : 'En cours'}`
            ];
            
            baseInfo.forEach(info => doc.text(info, styles.tableCell));
            doc.moveDown(1);

            // Section Équipe
            doc.text('Équipe du Projet', styles.sectionTitle);
            doc.moveDown(0.5);
            
            doc.text(`Propriétaire: ${project.businessOwner?.fullname || 'Non assigné'} (${project.businessOwner?.email || 'N/A'})`, styles.teamMember);
            doc.text(`Manager: ${project.businessManager?.fullname || 'Non assigné'} (${project.businessManager?.email || 'N/A'})`, styles.teamMember);
            
            // Comptables
            doc.text('Comptables:', { ...styles.teamMember, font: 'Helvetica-Bold' });
            project.accountants?.length > 0 
                ? project.accountants.forEach(acc => 
                    doc.text(`- ${acc.fullname} (${acc.email})`, styles.teamMember))
                : doc.text('- Aucun comptable assigné', styles.teamMember);
            
            // Responsables Financiers
            doc.text('Responsables Financiers:', { ...styles.teamMember, font: 'Helvetica-Bold' });
            project.financialManagers?.length > 0 
                ? project.financialManagers.forEach(fm => 
                    doc.text(`- ${fm.fullname} (${fm.email})`, styles.teamMember))
                : doc.text('- Aucun responsable financier', styles.teamMember);
            
            // Responsables RH
            doc.text('Responsables RH:', { ...styles.teamMember, font: 'Helvetica-Bold' });
            project.rhManagers?.length > 0 
                ? project.rhManagers.forEach(rh => 
                    doc.text(`- ${rh.fullname} (${rh.email})`, styles.teamMember))
                : doc.text('- Aucun responsable RH', styles.teamMember);
            
            doc.moveDown(1.5);

            // Assets Actif
            doc.text('Assets Actif', styles.sectionTitle);
            doc.moveDown(0.5);

            if (project.assets_actif?.length > 0) {
                const assetHeaders = ['Nom', 'Valeur', 'Date Acquisition', 'Type'];
                const assetWidths = [180, 80, 100, 120];
                const assetRows = project.assets_actif.map(asset => [
                    asset.name || 'N/A',
                    asset.total_value ? `${asset.total_value} €` : 'N/A',
                    asset.date_acquisition ? new Date(asset.date_acquisition).toLocaleDateString('fr-FR') : 'N/A',
                    asset.type_actif || 'N/A'
                ]);

                doc.y = drawTable(assetHeaders, assetRows, assetWidths, doc.y);
            } else {
                doc.text('Aucun asset actif', styles.tableCell);
            }
            doc.moveDown(1.5);

            // Taxes
            doc.text('Taxes', styles.sectionTitle);
            doc.moveDown(0.5);

            if (project.taxes?.length > 0) {
                const taxHeaders = ['Nom Taxe', 'Taux', 'Catégorie', 'Date Effet', 'Description'];
                const taxWidths = [100, 50, 100, 80, 200];
                const taxRows = project.taxes.map(tax => [
                    tax.nom_taxe || 'N/A',
                    tax.taux ? `${tax.taux}%` : 'N/A',
                    tax.categorie || 'N/A',
                    tax.date_effet ? new Date(tax.date_effet).toLocaleDateString('fr-FR') : 'N/A',
                    tax.description || 'Aucune description'
                ]);

                doc.y = drawTable(taxHeaders, taxRows, taxWidths, doc.y);
            } else {
                doc.text('Aucune taxe associée', styles.tableCell);
            }
            doc.moveDown(1.5);

// Section Objectifs
doc.text("Objectifs du projet", styles.sectionTitle);
doc.moveDown(0.5);

// Vérifier la présence d'objectifs
if (project.objectifs?.length > 0) {
    const objectifHeaders = ["Nom", "Type", "Statut", "Montant cible", "Budget min", "Budget max", "Début", "Fin", "Progress"];
    const objectifWidths = [80, 60, 70, 100, 80, 80, 60, 60, 60]; // Colonnes ajustées

    const objectifRows = [];

    project.objectifs.forEach(obj => {
        // Première ligne avec certaines infos
        objectifRows.push([
            obj.name || "N/A",
            obj.objectivetype || "N/A",
            obj.status || "N/A",
            obj.target_amount ? `${obj.target_amount} €` : "N/A",
            obj.minbudget ? `${obj.minbudget} €` : "N/A",
            obj.maxbudget ? `${obj.maxbudget} €` : "N/A",
            obj.datedebut ? new Date(obj.datedebut).toLocaleDateString("fr-FR") : "N/A",
            obj.datefin ? new Date(obj.datefin).toLocaleDateString("fr-FR") : "N/A",
            `${obj.progress}%`
        ]);

        // Deuxième ligne avec infos complémentaires (ou vide pour format 2 lignes)
        objectifRows.push([
            "", // Deuxième ligne vide sous "Nom"
            obj.objectivetype_detail || "", // Détail du type
            "", // Statut reste vide
            "", // Montant cible vide
            "", // Budget min vide
            "", // Budget max vide
            "", // Début vide
            "", // Fin vide
            ""  // Progress vide
        ]);
    });

    // Activer le mode paysage si trop large
    if (doc.page.width < 700) {
        doc.addPage({ layout: "landscape" });
    }

    // Dessiner le tableau des objectifs
    doc.y = drawTable(objectifHeaders, objectifRows, objectifWidths, doc.y);

   

   
} else {
    doc.text("Aucun objectif associé à ce projet", styles.tableCell);
}


        });

        doc.end();
    } catch (error) {
        console.error("Erreur génération rapport:", error);
        res.status(500).json({ 
            message: 'Erreur lors de la génération du rapport',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};


// Récupérer tous les utilisateurs assignés au projet par rôle
const getAssignedUsersToProject = async (req, res) => {
    const { projectId } = req.params;
  
    // Vérifier si l'ID du projet est valide
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: 'Invalid project ID format' });
    }
  
    try {
      // Chercher le projet avec l'ID valide
      const project = await Project.findById(projectId)
        .populate('accountants') // Populate accountants
        .populate('financialManagers') // Populate financial managers
        .populate('rhManagers') // Populate RH managers
        .populate('businessManager') // Populate business manager
  
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
  
      // Combinaison des utilisateurs assignés au projet
      const assignedUsers = [
        ...project.accountants,
        ...project.financialManagers,
        ...project.rhManagers,
        project.businessManager, // Ajout du business manager
      ];
  
      return res.json(assignedUsers);
    } catch (error) {
      console.error('Error fetching assigned users:', error);
      return res.status(500).json({ message: 'Failed to fetch assigned users' });
    }
};

module.exports = {
    addProject,
    assignAccountantToProject,getAllAccountantsofproject,getAllHRsOfProject,getAllFinancialManagersOfProject,
    assignRHManagerToProject,updateproject,generateProjectReport,generateProjectReportbyid,generateProjectsReportowner,
    assignFinancialManagerToProject,getAssignedUsersToProject,
    unassignRHManagerFromProject,deleteProjectById,
    unassignFinancialManagerFromProject,
    unassignAccountantFromProject,
    getProjectById,
    getMyProject,getbyid
};