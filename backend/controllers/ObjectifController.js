const Project = require("../model/Project");
const Objectif = require("../model/Objectif");
const mongoose = require("mongoose");

const getObjectifTypes = async (req, res) => {
  try {
    const types = Objectif.schema.path("objectivetype").enumValues; // Retrieve the enum values
    res.status(200).json({ success: true, data: types });
  } catch (error) {
    console.error("Error retrieving objective types:", error);
    res.status(500).json({ success: false, message: "Error retrieving objective types", error: error.message });
  }
};

const createObjectif = async (req, res) => {
    try {
      // Check if req.user is set
      if (!req.user || !req.user.userId) {
        return res.status(401).json({ success: false, message: "User not authenticated" });
      }
  
      const { userId } = req.user;
      console.log("User ID from JWT:", userId); // Debug log
  
      // Use the project ID sent in the request body
      const { project: projectId } = req.body;
      console.log("Provided project ID:", projectId); // Debug log
  
      // Validate projectId
      if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ success: false, message: "Invalid or missing project ID" });
      }
  
      // Verify the project exists and the user is associated with it
      const project = await Project.findOne({
        _id: projectId,
        $or: [
          { businessManager: userId },
          { financialManagers: userId },
        ],
      });
      console.log("Found project:", project); // Debug log
  
      if (!project) {
        return res.status(404).json({ success: false, message: "Project not found or user not authorized" });
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
      const validTypes = Objectif.schema.path("objectivetype").enumValues;
      if (!validTypes.includes(objectivetype)) {
        errors.objectivetype = `Objective type must be one of: ${validTypes.join(", ")}.`;
      }
      if (typeof isStatic !== "boolean") {
        errors.isStatic = "isStatic must be a boolean value.";
      }
  
      if (Object.keys(errors).length > 0) {
        return res.status(400).json({ success: false, errors });
      }
  
      const nouvelObjectif = new Objectif({
        name,
        description,
        target_amount,
        minbudget,
        maxbudget,
        datedebut,
        datefin,
        status: "InProgress",
        objectivetype,
        isStatic,
        project: projectId, // Use the provided projectId
      });
  
      await nouvelObjectif.save();
  
      project.objectifs.push(nouvelObjectif._id);
      project.status = project.status || "InProgress";
      await project.save();
  
      res.status(201).json({ success: true, message: "Objective created successfully", objectif: nouvelObjectif });
    } catch (error) {
      console.error("Error creating objective:", error);
      res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
  };

const findObjectifs = async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log("Finding objectives for userId:", userId); // Debug log

    const project = await Project.findOne({
      $or: [
        { businessManager: userId },
        { accountants: userId },
        { financialManagers: userId },
        { rhManagers: userId },
      ],
    }).populate("objectifs");
    console.log("Found project:", project); // Debug log

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found for this user" });
    }

    res.status(200).json({ success: true, objectifs: project.objectifs });
  } catch (error) {
    console.error("Error retrieving objectives:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

const getbyid = async (req, res) => {
  try {
    const data = await Objectif.findById(req.params.id);
    if (!data) {
      return res.status(404).json({ success: false, message: "Objective not found" });
    }
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("Error retrieving objective by ID:", err);
    res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  }
};

const markObjectifAsCompleted = async (req, res) => {
  try {
    const { objectifId } = req.params;

    const objectif = await Objectif.findByIdAndUpdate(
      objectifId,
      { status: "Completed" },
      { new: true }
    );

    if (!objectif) {
      return res.status(404).json({ success: false, message: "Objective not found" });
    }

    res.status(200).json({ success: true, message: "Objective marked as 'Completed'", objectif });
  } catch (error) {
    console.error("Error marking objective as completed:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

const markObjectifAsFailed = async (req, res) => {
  try {
    const { objectifId } = req.params;

    const objectif = await Objectif.findByIdAndUpdate(
      objectifId,
      { status: "Failed" },
      { new: true }
    );

    if (!objectif) {
      return res.status(404).json({ success: false, message: "Objective not found" });
    }

    res.status(200).json({ success: true, message: "Objective marked as 'Failed'", objectif });
  } catch (error) {
    console.error("Error marking objective as failed:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

const deleteObjectifById = async (req, res) => {
  try {
    const { objectifId } = req.params;

    const objectif = await Objectif.findByIdAndDelete(objectifId);

    if (!objectif) {
      return res.status(404).json({ success: false, message: "Objective not found" });
    }

    res.status(200).json({ success: true, message: "Objective deleted successfully" });
  } catch (error) {
    console.error("Error deleting objective:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

const updateObjectifById = async (req, res) => {
  try {
    const { objectifId } = req.params;
    const updateData = req.body;

    const errors = {};

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
    if (
      updateData.minbudget !== undefined &&
      updateData.maxbudget !== undefined &&
      updateData.minbudget > updateData.maxbudget
    ) {
      errors.minbudget = errors.minbudget || [];
      errors.maxbudget = errors.maxbudget || [];
      errors.minbudget = "Minimum budget cannot exceed maximum budget.";
      errors.maxbudget = "Minimum budget cannot exceed maximum budget.";
    }
    if (
      updateData.datedebut &&
      updateData.datefin &&
      new Date(updateData.datedebut) >= new Date(updateData.datefin)
    ) {
      errors.datedebut = errors.datedebut || [];
      errors.datefin = errors.datefin || [];
      errors.datedebut = "End date must be after start date.";
      errors.datefin = "End date must be after start date.";
    }
    if (updateData.objectivetype) {
      const validTypes = Objectif.schema.path("objectivetype").enumValues;
      if (!validTypes.includes(updateData.objectivetype)) {
        errors.objectivetype = `Objective type must be one of: ${validTypes.join(", ")}.`;
      }
    }
    if (updateData.isStatic !== undefined && typeof updateData.isStatic !== "boolean") {
      errors.isStatic = "isStatic must be a boolean value.";
    }
    if (updateData.progress !== undefined && (typeof updateData.progress !== "number" || updateData.progress < 0 || updateData.progress > 100)) {
      errors.progress = "Progress must be a number between 0 and 100.";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    const objectif = await Objectif.findByIdAndUpdate(objectifId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!objectif) {
      return res.status(404).json({ success: false, message: "Objective not found" });
    }

    res.status(200).json({ success: true, objectif });
  } catch (error) {
    console.error("Error updating objective:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

const getAllObjectifsByProjectId = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Validate projectId format (MongoDB ObjectId)
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ success: false, message: "Invalid project ID format" });
    }

    const project = await Project.findById(projectId).populate("objectifs");
    console.log("Found project for getAllObjectifsByProjectId:", project); // Debug log

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    res.status(200).json({ success: true, objectifs: project.objectifs });
  } catch (error) {
    console.error("Error retrieving objectives by projectId:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

const updateProgress = async (req, res) => {
  const { objectifId } = req.params;
  const { progress } = req.body;

  try {
    if (typeof progress !== "number" || progress < 0 || progress > 100) {
      return res.status(400).json({ success: false, error: "Progress must be a number between 0 and 100" });
    }

    const objectif = await Objectif.findById(objectifId);
    if (!objectif) {
      return res.status(404).json({ success: false, error: "Objective not found" });
    }

    objectif.progress = progress;
    objectif.status = progress === 100 ? "Completed" : progress > 0 ? "InProgress" : "Pending";
    await objectif.save();

    const project = await Project.findOne({ objectifs: objectifId });
    if (!project) {
      return res.status(404).json({ success: false, error: "Project not found" });
    }

    let totalProgress = 0;
    for (const objId of project.objectifs) {
      const obj = await Objectif.findById(objId);
      if (obj) {
        totalProgress += obj.progress;
      }
    }

    const averageProgress = project.objectifs.length > 0 ? totalProgress / project.objectifs.length : 0;
    project.objectifProgress = averageProgress;
    project.lastObjectiveUpdate = Date.now();
    await project.save();

    return res.status(200).json({ success: true, objectif });
  } catch (err) {
    console.error("Error updating progress:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

const generateObjectiveReport = async (req, res) => {
  const { projectId } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ success: false, message: "Invalid project ID format" });
    }

    const project = await Project.findById(projectId).populate("objectifs");

    if (!project) {
      return res.status(404).json({ success: false, error: "Project not found" });
    }

    const objectifs = {};
    project.objectifs.forEach((obj) => {
      objectifs[obj.name] = {
        status: obj.status,
        progress: obj.progress,
      };
    });

    return res.status(200).json({ success: true, objectifs });
  } catch (err) {
    console.error("Error generating objective report:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

const getProjectsOverview = async (req, res) => {
  try {
    const { role } = req.query;
    const { projectSearch } = req.params;

    let objectifQuery = {};
    if (role && role.toLowerCase() !== "all") {
      objectifQuery.objectivetype = role.toUpperCase();
    }

    let objectifs = [];
    let projectWallet = null;
    console.log("projectSearch:", projectSearch);

    if (projectSearch) {
      if (!mongoose.Types.ObjectId.isValid(projectSearch)) {
        return res.status(400).json({ success: false, message: "Invalid project ID format" });
      }

      const project = await Project.findById(projectSearch).populate("objectifs").populate("wallet");
      if (!project) {
        return res.status(200).json({
          success: true,
          message: "No project found matching the search criteria",
          data: [],
          completedToday: [],
        });
      }

      objectifs = (project.objectifs || []).filter(
        (obj) => !role || obj.objectivetype === role.toUpperCase()
      );
      projectWallet = project.wallet;
    } else {
      objectifs = await Objectif.find(objectifQuery).lean();
    }

    if (!objectifs.length) {
      return res.status(200).json({
        success: true,
        message: "No objectives found for the selected criteria",
        data: [],
        completedToday: [],
      });
    }

    const today = new Date("2025-04-01").toISOString().split("T")[0];

    const projectsList = [];
    const completedToday = [];

    objectifs.forEach((objectif) => {
      let progress = 0;
      const balance = projectWallet?.balance || 0;
      const maxBudget = objectif.maxbudget || Infinity;
      const minBudget = objectif.minbudget || 0;

      if (maxBudget > minBudget && balance && minBudget > 0) {
        const rawProgress = (balance / minBudget) * 100;
        progress = Math.min(Math.max(Math.round(rawProgress), 0), 100);
      }

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
          status = "InProgress";
      }

      let budgetStatus = "WithinBudget";
      if (balance) {
        const percentOfMax = (balance / maxBudget) * 100;
        const percentFromMin =
          maxBudget === minBudget ? 0 : ((balance - minBudget) / (maxBudget - minBudget)) * 100;

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
        maxBudget: maxBudget,
        minBudget: minBudget,
        department: objectif.objectivetype,
        dueDate: objectif.datefin.toISOString().split("T")[0],
        budget: objectif.maxbudget,
        spent: balance,
      };

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
      completedToday: completedToday,
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
  getbyid,
  markObjectifAsFailed,
  deleteObjectifById,
  updateObjectifById,
  generateObjectiveReport,
  getProjectsOverview,
};