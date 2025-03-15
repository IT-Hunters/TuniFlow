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

module.exports = {
    addProject,
    assignAccountantToProject,
    assignRHManagerToProject,
    assignFinancialManagerToProject,
    unassignRHManagerFromProject,
    unassignFinancialManagerFromProject,
    unassignAccountantFromProject,
    getProjectById,
    getMyProject,
};