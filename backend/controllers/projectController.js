const bcryptjs = require("bcryptjs");
const userModel = require("../model/user");
const validateRegister = require("../validation/registerValidation");
const validateLogin= require("../validation/login.validator");
const mongoose = require("mongoose");
require('dotenv').config();
const jwt=require("jsonwebtoken");
// Import des modèles discriminants
const FinancialManager = require("../model/FinancialManager");
const BusinessOwner = require("../model/BusinessOwner");
const Accountant = require("../model/Accountant");
const { getBusinessOwnerFromToken } = require("./auth");
const RH = require("../model/RH");


const Project = require("../model/Project");
const BusinessManager = require("../model/BusinessManager");

async function addProject(businessManagerName, projectData) {
    try {
        console.log("Début de la fonction addProject");

        // Récupérer le token de l'en-tête de la requête
        const token = projectData.token;
        if (!token) {
            throw new Error("Token manquant");
        }
        console.log("Token récupéré :", token);

        // Récupérer le BusinessOwner à partir du token
        const businessOwner = await getBusinessOwnerFromToken(token);
        console.log("BusinessOwner récupéré :", businessOwner);

        // 🔎 Rechercher le BusinessManager par son ID ou nom
        const manager = await BusinessManager.findOne({ fullname: businessManagerName }); // ou findOne({ fullname: businessManagerName })
        if (!manager) {
            throw new Error("BusinessManager non trouvé");
        }
        console.log("BusinessManager récupéré :", manager);

        // 🚨 Vérifier si le BusinessManager a déjà un projet
        if (manager.project) {
            throw new Error("Ce BusinessManager a déjà un projet assigné");
        }
        console.log("BusinessManager n'a pas de projet assigné");

        // ✅ Créer un nouveau projet
        const project = new Project({
            amount: projectData.amount,
            status: projectData.status,
            due_date: projectData.due_date,
            businessManager: manager._id, // Associer le projet au BusinessManager
            businessOwner: businessOwner._id, // Associer le projet au BusinessOwner
            accountants: projectData.accountants,
            financialManagers: projectData.financialManagers,
            rhManagers: projectData.rhManagers,
        });
        console.log("Projet créé :", project);

        await project.save(); // Sauvegarder le projet
        console.log("Projet sauvegardé");

        // 🔗 Associer le projet au BusinessManager
        manager.project = project._id;
        await manager.save();
        console.log("Projet associé au BusinessManager");

        // 🔗 Ajouter le projet à la liste des projets du BusinessOwner
        businessOwner.projects.push(project._id);
        await businessOwner.save();
        console.log("Projet ajouté à la liste des projets du BusinessOwner");

        // Retourner le résultat
        return { message: "Projet créé et lié au BusinessManager", project };
    } catch (error) {
        console.error("Erreur dans addProject :", error.message);
        throw error; // L'erreur sera gérée dans le contrôleur
    }
}
async function assignAccountantToProject(req, res) {
    try {
        const accountantId = req.params.accountantId;
        const userId = req.user.userId; // Récupération de l'ID de l'utilisateur connecté

        // Vérification si l'utilisateur a des projets associés
        const user = await userModel.findById(userId);
        if (!user || !user.projects || user.projects.length === 0) {
            return res.status(404).json({ message: "Aucun projet trouvé pour cet utilisateur" });
        }

        // Récupération du premier projet associé à cet utilisateur
        const projectId = user.projects[0];
        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({ message: "Aucun projet trouvé pour cet utilisateur" });
        }

        // Vérification de l'existence de l'accountant
        const accountant = await Accountant.findById(accountantId);
        if (!accountant) {
            return res.status(404).json({ message: "Comptable non trouvé" });
        }

        if (accountant.project) {
            return res.status(400).json({ message: "Ce comptable est déjà assigné à un projet" });
        }

        // Assignation de l'accountant au projet
        project.accountants.push(accountant._id);
        await project.save();

        accountant.project = project._id;
        await accountant.save();

        return res.status(200).json({ message: "Comptable assigné au projet avec succès", project });
    } catch (error) {
        console.error("Erreur lors de l'assignation:", error);
        return res.status(500).json({ message: "Erreur interne du serveur" });
    }
}

async function assignFinancialManagerToProject(req, res) {
    try {
        const financialManagerId = req.params.financialManagerId;
        const userId = req.user.userId;

        const user = await userModel.findById(userId);
        if (!user || !user.projects || user.projects.length === 0) {
            return res.status(404).json({ message: "Aucun projet trouvé pour cet utilisateur" });
        }

        const projectId = user.projects[0];
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: "Projet non trouvé" });
        }

        const financialManager = await FinancialManager.findById(financialManagerId);
        if (!financialManager) {
            return res.status(404).json({ message: "Financial Manager non trouvé" });
        }

        if (financialManager.project) {
            return res.status(400).json({ message: "Ce Financial Manager est déjà assigné à un projet" });
        }

        project.financialManagers.push(financialManager._id);
        await project.save();

        financialManager.project = project._id;
        await financialManager.save();

        return res.status(200).json({ message: "Financial Manager assigné au projet avec succès", project });
    } catch (error) {
        console.error("Erreur lors de l'assignation:", error);
        return res.status(500).json({ message: "Erreur interne du serveur" });
    }
}

async function assignRHManagerToProject(req, res) {
    try {
        const rhId = req.params.rhId;
        const userId = req.user.userId;

        const user = await userModel.findById(userId);
        if (!user || !user.projects || user.projects.length === 0) {
            return res.status(404).json({ message: "Aucun projet trouvé pour cet utilisateur" });
        }

        const projectId = user.projects[0];
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: "Projet non trouvé" });
        }

        const rh = await RH.findById(rhId);
        if (!rh) {
            return res.status(404).json({ message: "RH Manager non trouvé" });
        }

        if (rh.project) {
            return res.status(400).json({ message: "Ce RH est déjà assigné à un projet" });
        }

        project.rhManagers.push(rh._id);
        await project.save();

        rh.project = project._id;
        await rh.save();

        return res.status(200).json({ message: "RH Manager assigné au projet avec succès", project });
    } catch (error) {
        console.error("Erreur lors de l'assignation:", error);
        return res.status(500).json({ message: "Erreur interne du serveur" });
    }
}


async function unassignAccountantFromProject(req, res) {
    try {
        const accountantId = req.params.accountantId;
        const userId = req.user.userId;

        const user = await userModel.findById(userId);
        if (!user || !user.projects || user.projects.length === 0) {
            return res.status(404).json({ message: "Aucun projet trouvé pour cet utilisateur" });
        }

        const projectId = user.projects[0];
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: "Projet non trouvé" });
        }

        const accountant = await Accountant.findById(accountantId);
        if (!accountant) {
            return res.status(404).json({ message: "Comptable non trouvé" });
        }

        if (!accountant.project || accountant.project.toString() !== project._id.toString()) {
            return res.status(400).json({ message: "Ce comptable n'est pas assigné à ce projet" });
        }

        // Suppression de l'assignation
        project.accountants = project.accountants.filter(id => id.toString() !== accountantId);
        await project.save();

        accountant.project = null;
        await accountant.save();

        return res.status(200).json({ message: "Comptable retiré du projet avec succès", project });
    } catch (error) {
        console.error("Erreur lors de la désaffectation:", error);
        return res.status(500).json({ message: "Erreur interne du serveur" });
    }
}

async function unassignFinancialManagerFromProject(req, res) {
    try {
        const financialManagerId = req.params.financialManagerId;
        const userId = req.user.userId;

        const user = await userModel.findById(userId);
        if (!user || !user.projects || user.projects.length === 0) {
            return res.status(404).json({ message: "Aucun projet trouvé pour cet utilisateur" });
        }

        const projectId = user.projects[0];
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: "Projet non trouvé" });
        }

        const financialManager = await FinancialManager.findById(financialManagerId);
        if (!financialManager) {
            return res.status(404).json({ message: "Financial Manager non trouvé" });
        }

        if (!financialManager.project || financialManager.project.toString() !== project._id.toString()) {
            return res.status(400).json({ message: "Ce Financial Manager n'est pas assigné à ce projet" });
        }

        // Suppression de l'assignation
        project.financialManagers = project.financialManagers.filter(id => id.toString() !== financialManagerId);
        await project.save();

        financialManager.project = null;
        await financialManager.save();

        return res.status(200).json({ message: "Financial Manager retiré du projet avec succès", project });
    } catch (error) {
        console.error("Erreur lors de la désaffectation:", error);
        return res.status(500).json({ message: "Erreur interne du serveur" });
    }
}

async function unassignRHManagerFromProject(req, res) {
    try {
        const rhId = req.params.rhId;
        const userId = req.user.userId;

        const user = await userModel.findById(userId);
        if (!user || !user.projects || user.projects.length === 0) {
            return res.status(404).json({ message: "Aucun projet trouvé pour cet utilisateur" });
        }

        const projectId = user.projects[0];
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: "Projet non trouvé" });
        }

        const rh = await RH.findById(rhId);
        if (!rh) {
            return res.status(404).json({ message: "RH Manager non trouvé" });
        }

        if (!rh.project || rh.project.toString() !== project._id.toString()) {
            return res.status(400).json({ message: "Ce RH n'est pas assigné à ce projet" });
        }

        // Suppression de l'assignation
        project.rhManagers = project.rhManagers.filter(id => id.toString() !== rhId);
        await project.save();

        rh.project = null;
        await rh.save();

        return res.status(200).json({ message: "RH Manager retiré du projet avec succès", project });
    } catch (error) {
        console.error("Erreur lors de la désaffectation:", error);
        return res.status(500).json({ message: "Erreur interne du serveur" });
    }
}



module.exports = { addProject,assignAccountantToProject,assignRHManagerToProject,assignFinancialManagerToProject,
    unassignRHManagerFromProject,unassignFinancialManagerFromProject,unassignAccountantFromProject
 };
