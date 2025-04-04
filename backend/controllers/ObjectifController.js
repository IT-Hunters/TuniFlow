const Project = require("../model/Project");
const Objectif = require("../model/Objectif");
const mongoose = require("mongoose");

const getObjectifTypes = async (req, res) => {
    try {
        const types = Objectif.schema.path('objectivetype').enumValues; // Retrieve the enum values
        res.status(200).json({ success: true, data: types });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error retrieving objective types', error: error.message });
    }
};

const createObjectif = async (req, res) => {
    try {
        const {userId} = req.body;

        // Retrieve the project associated with the logged-in user
        const project = await Project.findOne({
            $or: [
                { businessManager: userId },
                { financialManagers: userId },
            ],
        });

        if (!project) {
            return res.status(404).json({ success: false, message: "Project not found for this user" });
        }

        // Retrieve objective data from the request body
        const {
            name,
            description,
            target_amount,
            minbudget,
            maxbudget,
            datedebut,
            datefin,
            objectivetype,
            isStatic,
        } = req.body;

        // Validation errors object
        const errors = {};

        // Validate required fields
        if (!name || name.trim() === "") {
            errors.name = "Objective name is required.";
        }
        if (!description || description.trim() === "") {
            errors.description = "Objective description is required.";
        }
        if (!target_amount || target_amount <= 0) {
            errors.target_amount = "Target amount must be a positive number.";
        }
        if (!minbudget || minbudget < 0) {
            errors.minbudget = "Minimum budget must be a non-negative number.";
        }
        if (!maxbudget || maxbudget <= 0) {
            errors.maxbudget = "Maximum budget must be a positive number.";
        }
        if (minbudget > maxbudget) {
            errors.minbudget = errors.minbudget || [];
            errors.maxbudget = errors.maxbudget || [];
            errors.minbudget = "Minimum budget cannot exceed maximum budget.";
            errors.maxbudget = "Minimum budget cannot exceed maximum budget.";
        }
        if (!datedebut) {
            errors.datedebut = "Start date is required.";
        }
        if (!datefin) {
            errors.datefin = "End date is required.";
        }
        if (new Date(datedebut) >= new Date(datefin)) {
            errors.datedebut = errors.datedebut || [];
            errors.datefin = errors.datefin || [];
            errors.datedebut = "End date must be after start date.";
            errors.datefin = "End date must be after start date.";
        }
        if (!objectivetype) {
            errors.objectivetype = "Objective type is required.";
        }
        // Validate objectivetype against enum values
        const validTypes = Objectif.schema.path('objectivetype').enumValues;
        if (!validTypes.includes(objectivetype)) {
            errors.objectivetype = `Objective type must be one of: ${validTypes.join(", ")}.`;
        }
        if (typeof isStatic !== "boolean") {
            errors.isStatic = "isStatic must be a boolean value.";
        }

        // If there are validation errors, return them
        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ success: false, errors });
        }

        // Create a new objective
        const nouvelObjectif = new Objectif({
            name,
            description,
            target_amount,
            minbudget,
            maxbudget,
            datedebut,
            datefin,
            status: "InProgress", // Default value
            objectivetype,
            isStatic,
            project: project._id, // Associate the objective with the project
        });

        // Save the objective
        await nouvelObjectif.save();

        // Add the objective to the project's list of objectives
        project.objectifs.push(nouvelObjectif._id);
        project.status = project.status || "InProgress"; // Default value for the project
        await project.save();

        // Successful response
        res.status(201).json({ success: true, message: "Objective created successfully", objectif: nouvelObjectif });
    } catch (error) {
        console.error("Error creating objective:", error);
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

const findObjectifs = async (req, res) => {
    try {
        const userId = req.user.userId;

        const project = await Project.findOne({
            $or: [
                { businessManager: userId },
                { accountants: userId },
                { financialManagers: userId },
                { rhManagers: userId },
            ]
        }).populate('objectifs');

        if (!project) {
            return res.status(404).json({ message: "Project not found for this user" });
        }

        res.status(200).json({ objectifs: project.objectifs });
    } catch (error) {
        console.error("Error retrieving objectives:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const markObjectifAsCompleted = async (req, res) => {
    try {
        const { objectifId } = req.params; // Retrieve the objective ID from URL parameters

        // Find and update the objective
        const objectif = await Objectif.findByIdAndUpdate(
            objectifId,
            { status: "Completed" },
            { new: true } // Return the updated objective
        );

        if (!objectif) {
            return res.status(404).json({ message: "Objective not found" });
        }

        // Successful response
        res.status(200).json({ message: "Objective marked as 'Completed'", objectif });
    } catch (error) {
        console.error("Error updating objective:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const markObjectifAsFailed = async (req, res) => {
    try {
        const { objectifId } = req.params; // Retrieve the objective ID from URL parameters

        // Find and update the objective
        const objectif = await Objectif.findByIdAndUpdate(
            objectifId,
            { status: "Failed" },
            { new: true } // Return the updated objective
        );

        if (!objectif) {
            return res.status(404).json({ message: "Objective not found" });
        }

        // Successful response
        res.status(200).json({ message: "Objective marked as 'Failed'", objectif });
    } catch (error) {
        console.error("Error updating objective:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const deleteObjectifById = async (req, res) => {
    try {
        const { objectifId } = req.params; // Retrieve the objective ID from URL parameters

        // Delete the objective by its ID
        const objectif = await Objectif.findByIdAndDelete(objectifId);

        if (!objectif) {
            return res.status(404).json({ message: "Objective not found" });
        }

        // Successful response
        res.status(200).json({ message: "Objective deleted successfully" });
    } catch (error) {
        console.error("Error deleting objective:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const updateObjectifById = async (req, res) => {
    try {
        const { objectifId } = req.params; // Retrieve the objective ID from URL parameters
        const updateData = req.body; // Update data sent in the request body

        // Validation errors object
        const errors = {};

        // Validate provided fields
        if (updateData.name && updateData.name.trim() === "") {
            errors.name = "Objective name cannot be empty.";
        }
        if (updateData.description && updateData.description.trim() === "") {
            errors.description = "Objective description cannot be empty.";
        }
        if (updateData.target_amount !== undefined && updateData.target_amount <= 0) {
            errors.target_amount = "Target amount must be a positive number.";
        }
        if (updateData.minbudget !== undefined && updateData.minbudget < 0) {
            errors.minbudget = "Minimum budget must be a non-negative number.";
        }
        if (updateData.maxbudget !== undefined && updateData.maxbudget <= 0) {
            errors.maxbudget = "Maximum budget must be a positive number.";
        }
        if (updateData.minbudget !== undefined && updateData.maxbudget !== undefined && updateData.minbudget > updateData.maxbudget) {
            errors.minbudget = errors.minbudget || [];
            errors.maxbudget = errors.maxbudget || [];
            errors.minbudget = "Minimum budget cannot exceed maximum budget.";
            errors.maxbudget = "Minimum budget cannot exceed maximum budget.";
        }
        if (updateData.datedebut && updateData.datefin && new Date(updateData.datedebut) >= new Date(updateData.datefin)) {
            errors.datedebut = errors.datedebut || [];
            errors.datefin = errors.datefin || [];
            errors.datedebut = "End date must be after start date.";
            errors.datefin = "End date must be after start date.";
        }
        if (updateData.objectivetype) {
            const validTypes = Objectif.schema.path('objectivetype').enumValues;
            if (!validTypes.includes(updateData.objectivetype)) {
                errors.objectivetype = `Objective type must be one of: ${validTypes.join(", ")}.`;
            }
        }
        if (updateData.isStatic !== undefined && typeof updateData.isStatic !== "boolean") {
            errors.isStatic = "isStatic must be a boolean value.";
        }

        // If there are validation errors, return them
        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ success: false, errors });
        }

        // Update the objective by its ID
        const objectif = await Objectif.findByIdAndUpdate(objectifId, updateData, {
            new: true, // Return the updated objective
            runValidators: true, // Validate the data before saving
        });

        if (!objectif) {
            return res.status(404).json({ success: false, message: "Objective not found" });
        }

        // Successful response with the updated objective
        res.status(200).json({ success: true, objectif });
    } catch (error) {
        console.error("Error updating objective:", error);
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

const getAllObjectifsByProjectId = async (req, res) => {
    try {
        const { projectId } = req.params; // Retrieve the project ID from URL parameters

        // Find the project by its ID and populate the objectives
        const project = await Project.findById(projectId).populate("objectifs");

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        // Return all objectives associated with the project
        res.status(200).json({ objectifs: project.objectifs });
    } catch (error) {
        console.error("Error retrieving objectives:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

async function updateProgress(req, res) {
    const { objectifId } = req.params;
    const { progress } = req.body;

    try {
        const objectif = await Objectif.findById(objectifId);
        if (!objectif) {
            return res.status(404).json({ error: "Objective not found" });
        }

        objectif.progress = progress;  // Update the objective's progress
        objectif.status = progress === 100 ? "Completed" : objectif.status;
        objectif.status = progress !== 100 ? "Pending" : objectif.status;  // Change status to "Completed" if progress is 100%
        await objectif.save();

        // Update the overall project progress
        const project = await Project.findOne({ objectifs: objectifId });
        if (!project) {
            return res.status(404).json({ error: "Project not found" });
        }

        // Use a for loop to await promises
        let totalProgress = 0;
        for (const objectifId of project.objectifs) {
            const obj = await Objectif.findById(objectifId);
            if (obj) {
                totalProgress += obj.progress;  // Add the objective's progress if found
            }
        }

        const averageProgress = project.objectifs.length > 0 ? totalProgress / project.objectifs.length : 0;

        project.objectifProgress = averageProgress;
        project.lastObjectiveUpdate = Date.now();
        await project.save();

        return res.status(200).json({ success: true, objectif: objectif });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

async function generateObjectiveReport(req, res) {
    const { projectId } = req.params; // Retrieve the projectId from URL parameters

    try {
        // Find the specific project with the given ID
        const project = await Project.findById(projectId).populate('objectifs');

        if (!project) {
            return res.status(404).json({ error: "Project not found" });
        }

        // Create a map with the objective name as the key and an object with its status and progress as the value
        const objectifs = {};
        project.objectifs.forEach(obj => {
            objectifs[obj.name] = {
                status: obj.status,
                progress: obj.progress
            };
        });
        return res.status(200).json({ objectifs });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
async function getProjectsOverview(req, res) {
    try {
      const { role } = req.query; 
      const { projectSearch } = req.params;
      // Build the base query for objectifs
      let objectifQuery = {};
      if (role && role.toLowerCase() !== "all") {
        objectifQuery.objectivetype = role.toUpperCase(); 
      }

      // If projectSearch is provided, find a single project
      let objectifs = [];
      let projectWallet = null; // To store the project's wallet data
      console.log("projectSearch:", projectSearch);
      if (projectSearch) {
        // Build project query (assuming projectSearch is the project name)

        // Find one project, populate its objectifs and wallet
        const project = await Project.findById(projectSearch).populate("objectifs").populate("wallet");
        if (!project) {
          return res.status(200).json({
            success: true,
            message: "No project found matching the search criteria",
            data: [],
            completedToday: []
          });
        }

        // Extract objectifs from the found project and filter by role if specified
        objectifs = (project.objectifs || [])
          .filter(obj => !role || obj.objectivetype === role.toUpperCase());

        // Store the project's wallet for use in progress calculation
        projectWallet = project.wallet;
        console.log("WA3LLRT " + projectWallet);
      } else {
        // If no project search, fetch all objectifs directly
        objectifs = await Objectif.find(objectifQuery).lean();
        // Note: Without a project, wallet data won't be available unless linked elsewhere
      }

      if (!objectifs.length) {
        return res.status(200).json({
          success: true,
          message: "No objectives found for the selected criteria",
          data: [],
          completedToday: []
        });
      }
  
      // Current date (April 1, 2025) in YYYY-MM-DD format
      const today = new Date("2025-04-01").toISOString().split("T")[0];

      // Map MongoDB objectifs to frontend-compatible structure
      const projectsList = [];
      const completedToday = [];

      objectifs.forEach((objectif) => {
        // Calculate progress based on project's wallet balance relative to minbudget and maxbudget
        let progress = 0;
        const balance = projectWallet.balance || 0; 
        const maxBudget = objectif.maxbudget || Infinity;
        const minBudget = objectif.minbudget || 0;

        if (maxBudget > minBudget) {
            // Calculate progress as a percentage within the range
            const rawProgress = (balance  /  minBudget) * 100;
            progress = Math.min(Math.max(Math.round(rawProgress), 0), 100);
          } else {
            // If maxBudget is 0 or invalid, progress remains 0
            progress = 0;
          }
        console.log("Objectif:", objectif.name);
        console.log("Balance:", balance);
        console.log("minBudget:", minBudget, "maxBudget:", maxBudget);
        console.log("Condition 1 (balance && maxBudget > minBudget):", balance && maxBudget > minBudget);
        console.log("Condition 2 (balance >= maxBudget):", balance >= maxBudget);
        console.log("Progress calculated:", progress);

        // Map status to frontend-compatible terms
        let status;
        switch (objectif.status?.toLowerCase()) {
          case "inprogress":
            status = "InProgress";
            break;
          case "completed":
            status = "Completed";
            break;
          case "failed":
            status = "Failed"; 
            break;
          default:
            status = "InProgress"; // Default if status is undefined
        }

        // Add budget status check with close/at risk conditions
        let budgetStatus = "WithinBudget";
        if (balance) {
          const percentOfMax = (balance / maxBudget) * 100;
          const percentFromMin = maxBudget === minBudget ? 0 : ((balance - minBudget) / (maxBudget - minBudget)) * 100;

          if (balance > maxBudget) {
            budgetStatus = "OverBudget";
          } else if (balance < minBudget) {
            budgetStatus = "UnderBudget";
          } else if (percentOfMax >= 90) {
            budgetStatus = "CloseToLimit";
          } else if (percentFromMin <= 10 && minBudget > 0) {
            budgetStatus = "AtRisk";
          }
        }

        const projectData = {
          id: objectif._id.toString(),
          name: objectif.name,
          status: status,
          budgetStatus: budgetStatus,
          progress: progress,
          maxBudget:maxBudget,
          minBudget:minBudget,
          department: objectif.objectivetype,
          dueDate: objectif.datefin.toISOString().split("T")[0],
          budget: objectif.maxbudget,
          spent: balance, // Use project's wallet balance as spent
        };

        // Check if completed today
        const dueDateStr = objectif.updatedAt.toISOString().split("T")[0];
        if (status === "Completed" && dueDateStr === today) {
          completedToday.push(projectData);
        } else {
          projectsList.push(projectData);
        }
      });
  
      res.status(200).json({
        success: true,
        message: "Objectives retrieved successfully",
        data: projectsList,
        completedToday: completedToday
      });
    } catch (error) {
      console.error("Error fetching project objectives:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch objectives",
        error: error.message,
      });
    }
  };
module.exports = {
    createObjectif,
    getAllObjectifsByProjectId,
    findObjectifs,
    updateProgress,
    getObjectifTypes,
    markObjectifAsCompleted,
    markObjectifAsFailed,
    deleteObjectifById,
    updateObjectifById,
    generateObjectiveReport,
    getProjectsOverview
};