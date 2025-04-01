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
const { getBusinessOwnerFromToken } = require("./auth");
const RH = require("../model/RH");

const Project = require("../model/Project");
const BusinessManager = require("../model/BusinessManager");

async function addProject(businessManagerId, projectData) {
    try {
        console.log("Starting addProject function");

        // Retrieve the token from the request headers
        const token = projectData.token;
        if (!token) {
            throw new Error("Token missing");
        }
        console.log("Token retrieved:", token);

        // Retrieve the BusinessOwner from the token
        const businessOwner = await getBusinessOwnerFromToken(token);
        console.log("BusinessOwner retrieved:", businessOwner);

        // 🔎 Find the BusinessManager by ID
        const manager = await BusinessManager.findById(businessManagerId);
        if (!manager) {
            throw new Error("BusinessManager not found");
        }
        console.log("BusinessManager retrieved:", manager);

        // 🚨 Check if the BusinessManager already has a project
        if (manager.project) {
            throw new Error("This BusinessManager already has an assigned project");
        }
        console.log("BusinessManager has no assigned project");

        // ✅ Create a new project
        const project = new Project({
            amount: projectData.amount,
            status: projectData.status,
            due_date: projectData.due_date,
            businessManager: manager._id, // Associate the project with the BusinessManager
            businessOwner: businessOwner._id, // Associate the project with the BusinessOwner
            accountants: projectData.accountants,
            financialManagers: projectData.financialManagers,
            rhManagers: projectData.rhManagers,
        });
        console.log("Project created:", project);

        await project.save(); // Save the project
        console.log("Project saved");

        // 🔗 Associate the project with the BusinessManager
        manager.project = project._id;
        await manager.save();
        console.log("Project associated with BusinessManager");

        // 🔗 Add the project to the BusinessOwner's project list
        businessOwner.projects.push(project._id);
        await businessOwner.save();
        console.log("Project added to BusinessOwner's project list");

        // Return the result
        return { message: "Project created and linked to BusinessManager", project };
    } catch (error) {
        console.error("Error in addProject:", error.message);
        throw error; // The error will be handled in the controller
    }
}

async function assignAccountantToProject(req, res) {
    try {
        const accountantId = req.params.accountantId;
        const userId = req.user.userId; // Retrieve the logged-in user's ID

        // Check if the user has associated projects
        const user = await userModel.findById(userId);
        if (!user || !user.project || user.project.length === 0) {
            return res.status(404).json({ message: "No project found for this user" });
        }

        // Retrieve the first project associated with this user
        const projectId = user.project;
        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({ message: "No project found for this user" });
        }

        // Check if the accountant exists
        const accountant = await Accountant.findById(accountantId);
        if (!accountant) {
            return res.status(404).json({ message: "Accountant not found" });
        }

        if (accountant.project) {
            return res.status(400).json({ message: "This accountant is already assigned to a project" });
        }

        // Assign the accountant to the project
        project.accountants.push(accountant._id);
        await project.save();

        accountant.project = project._id;
        await accountant.save();

        return res.status(200).json({ message: "Accountant assigned to project successfully", project });
    } catch (error) {
        console.error("Error during assignment:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function getbyid(req, res) {
    try {
        const data = await Project.findById(req.params.id);
        res.send(data);
    } catch (err) {
        res.send(err);
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

        return res.status(200).json({ message: "RH Manager removed from project successfully", project });
    } catch (error) {
        console.error("Error during unassignment:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function getProjectById(req, res) {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        res.status(200).json(project);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

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
            role: "HR", 
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
        const { id: projectId } = req.params; // Correction ici ✅

        // Vérifier si le projet existe
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: "Projet non trouvé" });
        }

        // Désaffecter les utilisateurs liés
        await BusinessManager.updateOne({ _id: project.businessManager }, { $unset: { project: "" } });
        await Accountant.updateMany({ _id: { $in: project.accountants } }, { $pull: { projects: projectId } });
        await FinancialManager.updateMany({ _id: { $in: project.financialManagers } }, { $pull: { projects: projectId } });
        await BusinessOwner.updateOne({ _id: project.businessOwner }, { $unset: { project: "" } });
        await RH.updateMany({ _id: { $in: project.rhManagers } }, { $pull: { projects: projectId } });

        // Supprimer le projet
        await Project.findByIdAndDelete(projectId);

        res.status(200).json({ message: "Projet supprimé avec succès et utilisateurs désaffectés" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la suppression du projet" });
    }
};

module.exports = {
    addProject,
    assignAccountantToProject,getAllAccountantsofproject,getAllHRsOfProject,getAllFinancialManagersOfProject,
    assignRHManagerToProject,updateproject,
    assignFinancialManagerToProject,
    unassignRHManagerFromProject,deleteProjectById,
    unassignFinancialManagerFromProject,
    unassignAccountantFromProject,
    getProjectById,
    getMyProject,getbyid
};