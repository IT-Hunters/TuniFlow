const Project = require("../model/Project");
const Objectif = require("../model/Objectif");
const mongoose = require("mongoose");
const createObjectif = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Récupérer le projet associé à l'utilisateur connecté
        const project = await Project.findOne({
            $or: [
                { businessManager: userId },
                { financialManagers: userId },
            ],
        });

        if (!project) {
            return res.status(404).json({ message: "Projet non trouvé pour cet utilisateur" });
        }

        // Récupérer les données de l'objectif depuis le corps de la requête
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

        // Créer un nouvel objectif
        const nouvelObjectif = new Objectif({
            name,
            description,
            target_amount,
            minbudget,
            maxbudget,
            datedebut,
            datefin,
            status: "Pending", // Valeur par défaut
            objectivetype,
            isStatic,
            project: project._id, // Associer l'objectif au projet
        });

        // Sauvegarder l'objectif
        await nouvelObjectif.save();

        // Ajouter l'objectif à la liste des objectifs du projet
        project.objectifs.push(nouvelObjectif._id);
        project.status = project.status || "Pending"; // Valeur par défaut pour le projet
        await project.save();

        // Réponse réussie
        res.status(201).json({ message: "Objectif créé avec succès", objectif: nouvelObjectif });
    } catch (error) {
        console.error("Erreur lors de la création de l'objectif :", error);
        res.status(500).json({ message: "Erreur interne du serveur" });
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
            return res.status(404).json({ message: "Projet non trouvé pour cet utilisateur" });
        }

        res.status(200).json({ objectifs: project.objectifs });
    } catch (error) {
        console.error("Erreur lors de la récupération des objectifs :", error);
        res.status(500).json({ message: "Erreur interne du serveur" });
    }
};


const markObjectifAsCompleted = async (req, res) => {
    try {
        const { objectifId } = req.params; // Récupérer l'ID de l'objectif depuis les paramètres de l'URL

        // Trouver et mettre à jour l'objectif
        const objectif = await Objectif.findByIdAndUpdate(
            objectifId,
            { status: "Completed" },
            { new: true } // Retourner l'objectif mis à jour
        );

        if (!objectif) {
            return res.status(404).json({ message: "Objectif non trouvé" });
        }

        // Réponse réussie
        res.status(200).json({ message: "Objectif marqué comme 'Completed'", objectif });
    } catch (error) {
        console.error("Erreur lors de la mise à jour de l'objectif :", error);
        res.status(500).json({ message: "Erreur interne du serveur" });
    }
};


const markObjectifAsFailed = async (req, res) => {
    try {
        const { objectifId } = req.params; // Récupérer l'ID de l'objectif depuis les paramètres de l'URL

        // Trouver et mettre à jour l'objectif
        const objectif = await Objectif.findByIdAndUpdate(
            objectifId,
            { status: "Failed" },
            { new: true } // Retourner l'objectif mis à jour
        );

        if (!objectif) {
            return res.status(404).json({ message: "Objectif non trouvé" });
        }

        // Réponse réussie
        res.status(200).json({ message: "Objectif marqué comme 'Failed'", objectif });
    } catch (error) {
        console.error("Erreur lors de la mise à jour de l'objectif :", error);
        res.status(500).json({ message: "Erreur interne du serveur" });
    }
};

const deleteObjectifById = async (req, res) => {
    try {
        const { objectifId } = req.params; // Récupérer l'ID de l'objectif depuis les paramètres de l'URL

        // Supprimer l'objectif par son ID
        const objectif = await Objectif.findByIdAndDelete(objectifId);

        if (!objectif) {
            return res.status(404).json({ message: "Objectif non trouvé" });
        }

        // Réponse réussie
        res.status(200).json({ message: "Objectif supprimé avec succès" });
    } catch (error) {
        console.error("Erreur lors de la suppression de l'objectif :", error);
        res.status(500).json({ message: "Erreur interne du serveur" });
    }
};

const updateObjectifById = async (req, res) => {
    try {
        const { objectifId } = req.params; // Récupérer l'ID de l'objectif depuis les paramètres de l'URL
        const updateData = req.body; // Les données de mise à jour envoyées dans le corps de la requête

        // Mettre à jour l'objectif par son ID
        const objectif = await Objectif.findByIdAndUpdate(objectifId, updateData, {
            new: true, // Retourner l'objectif mis à jour
            runValidators: true, // Valider les données avant de les enregistrer
        });

        if (!objectif) {
            return res.status(404).json({ message: "Objectif non trouvé" });
        }

        // Réponse réussie avec l'objectif mis à jour
        res.status(200).json({ objectif });
    } catch (error) {
        console.error("Erreur lors de la mise à jour de l'objectif :", error);
        res.status(500).json({ message: "Erreur interne du serveur" });
    }
};
const getAllObjectifsByProjectId = async (req, res) => {
    try {
        const { projectId } = req.params; // Récupérer l'ID du projet depuis les paramètres de l'URL

        // Trouver le projet par son ID et peupler les objectifs
        const project = await Project.findById(projectId).populate("objectifs");

        if (!project) {
            return res.status(404).json({ message: "Projet non trouvé" });
        }

        // Retourner tous les objectifs associés au projet
        res.status(200).json({ objectifs: project.objectifs });
    } catch (error) {
        console.error("Erreur lors de la récupération des objectifs :", error);
        res.status(500).json({ message: "Erreur interne du serveur" });
    }
};

async function updateProgress(req, res) {
    const { objectifId } = req.params;
    const { progress } = req.body;

    try {
        const objectif = await Objectif.findById(objectifId);
        if (!objectif) {
            return res.status(404).json({ error: "Objectif not found" });
        }

        objectif.progress = progress;  // Met à jour la progression de l'objectif
        objectif.status = progress === 100 ? "Completed" : objectif.status;
        objectif.status = progress !== 100 ? "Pending" : objectif.status;  // Modifie le statut en "Completed" si la progression est 100%
        await objectif.save();

        // Mettez à jour la progression globale du projet
        const project = await Project.findOne({ objectifs: objectifId });
        if (!project) {
            return res.status(404).json({ error: "Project not found" });
        }

        // Utilisation d'un loop `for` pour attendre les promesses
        let totalProgress = 0;
        for (const objectifId of project.objectifs) {
            const obj = await Objectif.findById(objectifId);
            if (obj) {
                totalProgress += obj.progress;  // Ajoute la progression de l'objectif si trouvé
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
    const { projectId } = req.params; // Récupère le projectId depuis les paramètres de l'URL
  
    try {
      // Recherche du projet spécifique avec l'ID donné
      const project = await Project.findById(projectId).populate('objectifs');
  
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
  
      // Création d'un map avec le nom de l'objectif comme clé et un objet avec son statut et sa progression comme valeur
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
  
  
  
  

module.exports = {
    createObjectif,getAllObjectifsByProjectId,
    findObjectifs,updateProgress,
    markObjectifAsCompleted,
    markObjectifAsFailed,deleteObjectifById,updateObjectifById,generateObjectiveReport
};
