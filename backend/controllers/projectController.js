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
const Project = require("../model/Project");
const BusinessManager = require("../model/BusinessManager");
const PDFDocument = require("pdfkit");
const fs = require("fs");
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
        const wallet = new Wallet();
        await wallet.save();
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
            wallet: wallet
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

        // Vérifie si le dossier "reports" existe
        const reportsDir = "./reports";
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir);
        }

        // Récupérer le projet
        const project = await Project.findById(projectId)
            .populate("businessManager", "fullname lastname")
            .populate("businessOwner", "fullname lastname")
            .populate("employees", "name")
            .populate("financialManagers", "fullname lastname")
            .populate("accountants", "fullname lastname")
            .populate("rhManagers", "fullname lastname")
            .populate("assets_actif", "name total_value date_acquisition type_actif")
            .populate("taxes", "nom_taxe taux description categorie date_effet");

        if (!project) {
            return res.status(404).json({ message: "Projet non trouvé" });
        }

        const doc = new PDFDocument();
        const fileName = `project-${projectId}-report-${Date.now()}.pdf`;
        const filePath = `${reportsDir}/${fileName}`;
        const stream = fs.createWriteStream(filePath);

        doc.pipe(stream);

        // En-tête du document
        doc.fontSize(18).text(`Rapport du Projet: ${project.name || projectId}`, { align: "center" });
        doc.moveDown();
        doc.fontSize(12).text(`Généré le: ${new Date().toLocaleDateString()}`, { align: "center" });
        doc.moveDown(2);

        // Section Détails du Projet
        doc.fontSize(14).text("Détails du Projet", { underline: true });
        doc.moveDown(0.5);
        
        const projectDetails = [
            { label: "Statut", value: project.status },
            { label: "Montant", value: project.amount ? `${project.amount} €` : "N/A" },
            { label: "Date d'échéance", value: project.due_date ? new Date(project.due_date).toLocaleDateString() : "N/A" },
            { label: "Manager", value: project.businessManager ? `${project.businessManager.fullname} ${project.businessManager.lastname}` : "Non Assigné" },
            { label: "Owner", value: project.businessOwner ? `${project.businessOwner.fullname} ${project.businessOwner.lastname}` : "Non Assigné" }
        ];

        projectDetails.forEach(detail => {
            doc.fontSize(12).text(`• ${detail.label}: ${detail.value}`);
        });
        doc.moveDown(1);

        // Tableau des Assets Actif
        doc.fontSize(14).text("Assets Actif", { underline: true });
        doc.moveDown(0.5);

        if (project.assets_actif.length > 0) {
            const assetsTable = {
                headers: ["Nom", "Valeur", "Date Acqui", "Type"],
                rows: project.assets_actif.map(asset => [
                    asset.name,
                    `${asset.total_value} €`,
                    new Date(asset.date_acquisition).toLocaleDateString(),
                    asset.type_actif
                ])
            };

            drawTable(doc, assetsTable);
        } else {
            doc.fontSize(12).text("Aucun asset actif");
        }
        doc.moveDown(1);

        // Tableau des Taxes
        doc.fontSize(14).text("Taxes", { underline: true });
        doc.moveDown(0.5);

        if (project.taxes.length > 0) {
            const taxesTable = {
                headers: ["Nom Taxe", "Taux", "Catégorie", "Date Effet"],
                rows: project.taxes.map(tax => [
                    tax.nom_taxe,
                    `${tax.taux}%`,
                    tax.categorie,
                    new Date(tax.date_effet).toLocaleDateString()
                ])
            };

            drawTable(doc, taxesTable);
            
            // Ajout de la description des taxes après le tableau
            doc.moveDown(0.5);
            doc.fontSize(10).text("Descriptions des taxes:", { italic: true });
            project.taxes.forEach(tax => {
                doc.fontSize(10).text(`- ${tax.nom_taxe}: ${tax.description || "Pas de description"}`, { indent: 15 });
            });
        } else {
            doc.fontSize(12).text("Aucune taxe associée");
        }

        doc.end();

        stream.on("finish", () => {
            res.download(filePath);
        });

    } catch (error) {
        console.error("Erreur génération rapport:", error);
        res.status(500).json({ message: "Erreur lors de la génération du rapport", error });
    }
};

// Fonction helper pour dessiner des tableaux
function drawTable(doc, table) {
    const startY = doc.y;
    const margin = 80;
    const rowHeight = 20;
    const colWidths = [150, 80, 100, 100];
    const headerColor = '#f0f0f0';
    
    // Dessiner les en-têtes
    doc.font('Helvetica-Bold');
    let x = margin;
    table.headers.forEach((header, i) => {
        doc.rect(x, startY, colWidths[i], rowHeight).fillAndStroke(headerColor, '#000');
        doc.fillColor('#000').text(header, x + 5, startY + 5, { width: colWidths[i] - 10 });
        x += colWidths[i];
    });
    
    // Dessiner les lignes de données
    doc.font('Helvetica');
    table.rows.forEach((row, rowIndex) => {
        x = margin;
        row.forEach((cell, colIndex) => {
            doc.rect(x, startY + (rowIndex + 1) * rowHeight, colWidths[colIndex], rowHeight).stroke();
            doc.text(cell, x + 5, startY + (rowIndex + 1) * rowHeight + 5, { 
                width: colWidths[colIndex] - 10 
            });
            x += colWidths[colIndex];
        });
    });
    
    // Positionner le curseur après le tableau
    doc.y = startY + (table.rows.length + 1) * rowHeight + 10;
}
const generateProjectsReportowner = async (req, res) => {
    try {
        const userId = req.user.userId; // L'ID de l'utilisateur extrait du token après authentification

        // Trouver l'utilisateur et ses projets associés
        const user = await userModel.findById(userId).populate('projects');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.projects || user.projects.length === 0) {
            return res.status(404).json({ message: 'No projects found for this user' });
        }

        // Créer un document PDF
        const doc = new PDFDocument();

        // Créer un flux pour la réponse
        const stream = res.writeHead(200, {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="projects_report.pdf"',
        });

        // Pipe le document vers la réponse HTTP (envoie directement au client)
        doc.pipe(stream);

        // Ajouter un titre au rapport
        doc.fontSize(18).text('Rapport des Projets', { align: 'center' });

        // Ajouter des informations sur chaque projet
        user.projects.forEach((project, index) => {
            doc.addPage();
            doc.fontSize(14).text(`Projet ${index + 1}: ${project.name || 'Nom du projet non défini'}`, { underline: true });
            doc.moveDown();
            doc.fontSize(12).text(`Statut : ${project.status || 'Non spécifié'}`);
            doc.text(`Budget : $${project.amount ? project.amount.toLocaleString() : 'Non spécifié'}`);
            doc.text(`Date de fin : ${project.endDate ? new Date(project.endDate).toLocaleDateString() : 'En cours'}`);
            doc.text(`ID du projet : ${project._id}`);
            doc.moveDown(2); // Ajoute de l'espace entre les projets
        });

        // Finaliser et envoyer le PDF
        doc.end();
    } catch (error) {
        console.error("Error generating report:", error);
        res.status(500).json({ message: 'Server error while generating the report' });
    }
};
module.exports = {
    addProject,
    assignAccountantToProject,getAllAccountantsofproject,getAllHRsOfProject,getAllFinancialManagersOfProject,
    assignRHManagerToProject,updateproject,generateProjectReport,generateProjectReportbyid,generateProjectsReportowner,
    assignFinancialManagerToProject,
    unassignRHManagerFromProject,deleteProjectById,
    unassignFinancialManagerFromProject,
    unassignAccountantFromProject,
    getProjectById,
    getMyProject,getbyid
};