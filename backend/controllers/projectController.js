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

async function assignAccountantToProject(projectId, accountantId) {
    try {
        const project = await Project.findById(projectId);
        if (!project) {
            throw new Error("Projet non trouvé");
        }

        const accountant = await Accountant.findById(accountantId);
        if (!accountant) {
            throw new Error("Accountant non trouvé");
        }

        if (accountant.project) {
            throw new Error("Cet Accountant est déjà assigné à un projet");
        }

        project.accountants.push(accountant._id);
        await project.save();

        accountant.project = project._id;
        await accountant.save();

        return { message: "Accountant ajouté au projet avec succès", project };
    } catch (error) {
        throw error;
    }
}

async function assignFinancialManagerToProject(projectId, financialManagerId) {
    try {
        const project = await Project.findById(projectId);
        if (!project) {
            throw new Error("Projet non trouvé");
        }

        const financialManager = await FinancialManager.findById(financialManagerId);
        if (!financialManager) {
            throw new Error("FinancialManager non trouvé");
        }

        if (financialManager.project) {
            throw new Error("Ce FinancialManager est déjà assigné à un projet");
        }

        project.financialManagers.push(financialManager._id);
        await project.save();

        financialManager.project = project._id;
        await financialManager.save();

        return { message: "FinancialManager ajouté au projet avec succès", project };
    } catch (error) {
        throw error;
    }
}

// Fonction pour affecter un RH à un Project
async function assignRHManagerToProject(projectId, rhId) {
    try {
        const project = await Project.findById(projectId);
        if (!project) {
            throw new Error("Projet non trouvé");
        }

        const rh = await RH.findById(rhId);
        if (!rh) {
            throw new Error("RH Manager non trouvé");
        }

        if (rh.project) {
            throw new Error("Ce RH est déjà assigné à un projet");
        }

        project.rhManagers.push(rh._id);
        await project.save();

        rh.project = project._id;
        await rh.save();

        return { message: "RH Manager ajouté au projet avec succès", project };
    } catch (error) {
        throw error;
    }
}



module.exports = { addProject,assignAccountantToProject,assignRHManagerToProject,assignFinancialManagerToProject };
