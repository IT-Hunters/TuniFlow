const bcryptjs = require("bcryptjs");
const userModel = require("../model/user");
const validateRegister = require("../validation/registerValidation");
const validateLogin= require("../validation/login.validator");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const multerPicture= require("../config/multer-picture")
const uploadPicture= multerPicture.single("picture");
require('dotenv').config();
const jwt=require("jsonwebtoken");
const xlsx = require('xlsx');
// Import des modèles discriminants
const FinancialManager = require("../model/FinancialManager");
const BusinessOwner = require("../model/BusinessOwner");
const Accountant = require("../model/Accountant");
const BusinessManager = require("../model/BusinessManager");
const RH = require("../model/RH");
const Project=require("../model/Project");
const Employe = require('../model/Employe');
const nodemailer = require('nodemailer');


async function getAll(req,res) {
    try{
        const data = await userModel.find()
        res.send(data);
    }
    catch(err){
        res.send(err);
    }
}

const Register = async (req, res) => {
    try {
        // 1️⃣ Validation des données
        const { errors, isValid } = validateRegister(req.body);
        if (!isValid) {
            return res.status(400).json(errors);
        }

        // 2️⃣ Vérifier si l'utilisateur existe déjà
        const exist = await userModel.findOne({ email: req.body.email });
        if (exist) {
            return res.status(409).json({ email: "Utilisateur déjà existant" });
        }

        // 3️⃣ Hachage du mot de passe
        req.body.password = await bcryptjs.hash(req.body.password, 10);

        // 4️⃣ Sélection du modèle en fonction du rôle
        let userType;
        switch (req.body.role) {
            case "BUSINESS_OWNER":
                userType = new BusinessOwner({
                    email: req.body.email,
                    password: req.body.password,
                    fullname: req.body.fullname,
                    lastname: req.body.lastname,
                    role: req.body.role,
                    evidence: req.file ? req.file.path : null
                  
                });
                break;

            case "ACCOUNTANT":
                userType = new Accountant({
                    email: req.body.email,
                    password: req.body.password,
                    fullname: req.body.fullname,
                    lastname: req.body.lastname,
                    role: req.body.role
                   
                });
                break;

            case "RH":
                userType = new RH({
                    email: req.body.email,
                    password: req.body.password,
                    fullname: req.body.fullname,
                    lastname: req.body.lastname,
                    role: req.body.role
                    
                });
                break;

            case "FINANCIAL_MANAGER":
                userType = new FinancialManager({
                    email: req.body.email,
                    password: req.body.password,
                    fullname: req.body.fullname,
                    lastname: req.body.lastname,
                    role: req.body.role
                    
                });
                break;

            case "BUSINESS_MANAGER":
                userType = new BusinessManager({
                    email: req.body.email,
                    password: req.body.password,
                    fullname: req.body.fullname,
                    lastname: req.body.lastname,
                    role: req.body.role
                   
                });
                break;

            default:
                return res.status(400).json({ role: "Rôle invalide" });
        }

        // 5️⃣ Sauvegarde de l'utilisateur
        const result = await userType.save();
        res.status(201).json({ message: "Inscription réussie", user: result });

    } catch (error) {
        console.error("Erreur lors de l'inscription:", error);
        res.status(500).json({ message: "Erreur interne du serveur", error });
    }
};


const Login = async (req, res) => {
  const { errors, isValid } = validateLogin(req.body);

  if (!isValid) {
    return res.status(400).json(errors); // 400 pour une requête invalide
  }

  try {
    const existUser = await userModel.findOne({ email: req.body.email });
    if (!existUser) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const match = await bcryptjs.compare(req.body.password, existUser.password);
    if (!match) {
      return res.status(401).json({ message: 'Mot de passe incorrect' }); // 401 pour une authentification échouée
    }

    const payload = {
      userId: existUser._id,
      fullname: existUser.fullname,
      email: existUser.email,
      role: existUser.role
    };

    const token = jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: "1d" });
    return res.status(200).json({ token: token, role: existUser.role });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    return res.status(500).json({ message: 'Erreur interne du serveur' });
  }
};
/****************Update Profile********************* */ 


const updateProfile = async (req, res) => {
  const userId = req.user.userId; // Récupéré à partir du middleware authenticateJWT
  const updates = req.body; // Les champs à mettre à jour

  try {
    // Trouver l'utilisateur dans la base de données
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Vérifier le type d'utilisateur et mettre à jour les champs spécifiques
    switch (user.role) {
      case "BUSINESS_MANAGER":
        await BusinessManager.findOneAndUpdate(
          { _id: userId },
          { $set: updates },
          { new: true, runValidators: true }
        );
        break;
        case "BUSINESS_OWNER":
          await BusinessOwner.findOneAndUpdate(
            { _id: userId },
            { $set: updates },
            { new: true, runValidators: true }
          );
          break;

      case "RH":
        await RH.findOneAndUpdate(
          { _id: userId },
          { $set: updates },
          { new: true, runValidators: true }
        );
        break;

      case "FINANCIAL_MANAGER":
        await FinancialManager.findOneAndUpdate(
          { _id: userId },
          { $set: updates },
          { new: true, runValidators: true }
        );
        break;

      case "ACCOUNTANT":
        await Accountant.findOneAndUpdate(
          { _id: userId },
          { $set: updates },
          { new: true, runValidators: true }
        );
        break;

      default:
        return res.status(400).json({ message: "Rôle d'utilisateur non valide" });
    }

    // Renvoyer une réponse de succès
    return res.status(200).json({ message: "Utilisateur mis à jour avec succès" });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'utilisateur:", error);
    return res.status(500).json({ message: "Erreur interne du serveur" });
  }
};



/* *************************************************/
  async function findMyProfile(req, res) {
    try {
      // Vérifie si l'ID utilisateur est présent dans req.user
      if (!req.user || !req.user.userId) {
        return res.status(400).json({ message: 'ID utilisateur manquant.' });
      }
  
      // Vérifie si l'ID utilisateur est un ObjectId valide
      if (!mongoose.isValidObjectId(req.user.userId)) {
        return res.status(400).json({ message: 'ID utilisateur invalide.' });
      }
  
      // Convertit l'ID utilisateur en ObjectId
      const userId = new mongoose.Types.ObjectId(req.user.userId);
      console.log('User ID:', userId);
  
      // Recherche l'utilisateur par son _id
      const user = await userModel.findById(userId).select("-password");
  
      // Si l'utilisateur n'est pas trouvé
      if (!user) {
        return res.status(404).json({ message: 'Profil non trouvé.' });
      }
  
      // Si l'utilisateur est trouvé
      console.log('Profil trouvé:', user);
      res.status(200).json(user);
    } catch (err) {
      console.error('Erreur dans findMyProfile:', err);
      res.status(500).json({ message: 'Erreur serveur.' });
    }
  }

  async function deleteprofilbyid(req, res) {
    try {
        const data = await profileModel.findById({_id: req.params.id});
        res.status(200).json({
          message :"profil deleted succesfuly"
      });
      } catch (err) {
        res.send(err);
      }
    }

/* **********AddImage ************/
const AddPicture = async (req, res) => {
  try {
    await uploadPicture(req, res, async function (err) {
      if (err) {
        return res.status(500).json({ message: err.message });
      }

      // Vérifiez que req.user.userId est défini
      if (!req.user || !req.user.userId) {
        return res.status(400).json({ message: 'ID utilisateur manquant.' });
      }

      console.log('ID utilisateur:', req.user.userId);
      console.log('Nom du fichier uploadé:', req.file.filename);

      // Récupérer l'utilisateur pour déterminer son type
      const user = await userModel.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé.' });
      }

      // Accéder au modèle discriminé via userModel.discriminators
      const userDiscriminator = userModel.discriminators[user.userType];
      if (!userDiscriminator) {
        return res.status(400).json({ message: 'Type d\'utilisateur non supporté.' });
      }

      // Mettre à jour le profil avec l'image
      const data = await userDiscriminator.findOneAndUpdate(
        { _id: req.user.userId }, // Utilisez _id pour trouver l'utilisateur
        { $set: { picture: req.file.filename } }, // Mettre à jour le champ picture
        { new: true }
      ).catch(err => {
        console.error('Erreur lors de la mise à jour du profil:', err);
        throw err;
      });

      if (!data) {
        return res.status(404).json({ message: 'Profil non trouvé.' });
      }

      console.log('Données mises à jour:', data);
      return res.status(201).json({ message: 'Picture added with success', data });
    });
  } catch (error) {
    res.status(500).json(error);
  }
};
/************ deletemyprofile *********** */ 
    async function deletemyprofile(req, res) {
        console.log('req.user dans deletemyprofile:', req.user); 
        try {
            if (!req.user || !req.user.userId) {
                console.error('ID utilisateur manquant dans req.user:', req.user);
                return res.status(400).json({ message: 'ID utilisateur manquant.' });
            }
    
            if (!mongoose.isValidObjectId(req.user.userId)) {
                return res.status(400).json({ message: 'ID utilisateur invalide.' });
            }
    
            const userId = new mongoose.Types.ObjectId(req.user.userId);
            console.log('User ID:', userId);
    
            // Vérification de l'existence de l'utilisateur
            const userExists = await userModel.findById(userId);
            console.log('User exists:', userExists);
            if (!userExists) {
                return res.status(404).json({ message: 'Profil non trouvé.' });
            }
    
            // Suppression de l'utilisateur
            const deletedProfile = await userModel.findOneAndDelete({ _id: userId }).populate({
                path: "user",
                select: "-password"
            });
    
            if (!deletedProfile) {
                return res.status(404).json({ message: 'Profil non trouvé.' });
            }
    
            console.log('Profil supprimé:', deletedProfile); 
            res.status(200).json({ message: 'Profil supprimé avec succès.', deletedProfile });
        } catch (err) {
            console.error('Erreur dans deletemyprofile:', err);
            res.status(500).json({ message: 'Une erreur s\'est produite.' });
        }
    }


    const acceptAutorisation = async (req, res) => {
      const { id } = req.params; // ID du BusinessOwner
    
      try {
        // Trouver le BusinessOwner par son ID
        const owner = await BusinessOwner.findById(id);
        if (!owner) {
          return res.status(404).json({ message: "BusinessOwner non trouvé" });
        }
    
        // Mettre à jour directement l'autorisation à true
        owner.autorization = true;
        await owner.save();
    
        // Répondre avec l'utilisateur mis à jour
        res.status(200).json({ message: "Autorisation accordée", owner });
      } catch (error) {
        console.error("Erreur lors de la mise à jour de l'autorisation :", error);
        res.status(500).json({ message: "Erreur serveur" });
      }
    };
 
    async function getBusinessOwnerFromToken(token) {
      try {
          // Décoder le token pour obtenir l'ID du BusinessOwner
          const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
          if (!decodedToken) {
              throw new Error("Token invalide");
          }
  
          // Récupérer le BusinessOwner à partir de l'ID
          const businessOwner = await BusinessOwner.findById(decodedToken.userId);
          if (!businessOwner) {
              throw new Error("BusinessOwner non trouvé");
          }
  
          return businessOwner;
      } catch (error) {
          throw new Error(`Erreur lors de la récupération du BusinessOwner : ${error.message}`);
      }
  }
    
    
  const getAllBusinessManagers = async (req, res) => {
    try {
      const businessManagers = await userModel.find({ userType: 'BusinessManager' });
  
      if (!businessManagers || businessManagers.length === 0) {
        return res.status(404).json({ message: 'Aucun Business Manager trouvé' });
      }
  
      res.status(200).json(businessManagers);
    } catch (error) {
      console.error("Erreur lors de la récupération des Business Managers : ", error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  };
  const getAllBusinessOwners = async (req, res) => {
    try {
      const businessOwners = await userModel.find({ userType: 'BusinessOwner' });
  
      if (!businessOwners || businessOwners.length === 0) {
        return res.status(404).json({ message: 'Aucun Business owner trouvé' });
      }
  
      res.status(200).json(businessOwners);
    } catch (error) {
      console.error("Erreur lors de la récupération des Business Owners : ", error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  };
  const getAllRH = async (req, res) => {
    try {
      const rhs = await userModel.find({ userType: 'RH' });
  
      if (!rhs || rhs.length === 0) {
        return res.status(404).json({ message: 'Aucun RH trouvé' });
      }
  
      res.status(200).json(rhs);
    } catch (error) {
      console.error("Erreur lors de la récupération des RH : ", error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  };
  const getAllFinancialManagers = async (req, res) => {
    try {
      const financialManagers = await userModel.find({ userType: 'FinancialManager' });
  
      if (!financialManagers || financialManagers.length === 0) {
        return res.status(404).json({ message: 'Aucun Financial Manager trouvé' });
      }
  
      res.status(200).json(financialManagers);
    } catch (error) {
      console.error("Erreur lors de la récupération des Financial Managers : ", error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  };
  const getAllAccountants = async (req, res) => {
    try {
      const accountants = await userModel.find({ userType: 'Accountant' });
  
      if (!accountants || accountants.length === 0) {
        return res.status(404).json({ message: 'Aucun Accountant trouvé' });
      }
  
      res.status(200).json(accountants);
    } catch (error) {
      console.error("Erreur lors de la récupération des Accountants : ", error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  };
      
  const findMyProject = async (req, res) => {
    try {
      const userId = req.user.userId; // L'ID de l'utilisateur est extrait du token après authentification
  
      // Trouver l'utilisateur dans la base de données pour obtenir le projet associé
      const user = await userModel.findById(userId).populate('project'); // On suppose que 'project' est une référence à un autre modèle
  
      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }
  
      if (!user.project) {
        return res.status(404).json({ message: 'Aucun projet trouvé pour cet utilisateur' });
      }
  
      // Si un projet est trouvé, on le retourne dans la réponse
      res.status(200).json(user.project);
    } catch (error) {
      console.error("Erreur lors de la récupération du projet : ", error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
  // Envoi du code de vérification par e-mail
async function sendVerificationCode(req, res) {
  try {
    const { email } = req.body;
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    const code = Math.floor(100000 + Math.random() * 900000); // Code 6 chiffres
    verificationCodes[email] = code;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Code de vérification",
      text: `Votre code de vérification est : ${code}`,
    });

    res.json({ message: "Code envoyé par e-mail" });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de l'envoi du code", error: err });
  }
}
async function verifyCode(req, res) {
  const { email, code } = req.body;

  try {
    // Vérifier si le code est valide pour l'utilisateur
    const storedCode = verificationCodes[email];

    if (!storedCode) {
      return res.status(404).json({ message: "Aucun code de vérification trouvé pour cet utilisateur" });
    }

    if (parseInt(code) === storedCode) {
      // Code vérifié avec succès, tu peux ici faire des actions supplémentaires
      return res.status(200).json({ message: "Code vérifié avec succès" });
    } else {
      return res.status(400).json({ message: "Code de vérification incorrect" });
    }
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la vérification du code", error: err });
  }
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Générer un token JWT avec une durée de 24h
    const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, { expiresIn: "1d" });
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    // Configurer Nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Contenu HTML de l'email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "🔒 Réinitialisation de votre mot de passe",
      html: `
      <div style="background-color: #f4f4f4; padding: 20px; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; background: #fff; margin: auto; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); text-align: center;">
          
          <!-- Logo -->
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://www.futuronomics.com/wp-content/uploads/2024/07/best-1024x576.png" 
                 alt="TuniFlow Logo" style="max-width: 150px; border-radius: 10px;">
          </div>
    
          <h2 style="color: #333;">🔐 Réinitialisation de votre mot de passe</h2>
          <p style="color: #555;">Bonjour,</p>
          <p style="color: #555;">Cliquez sur le bouton ci-dessous pour réinitialiser votre mot de passe :</p>
          
          <div style="margin: 20px 0;">
            <a href="${resetLink}" 
              style="display: inline-block; padding: 14px 24px; font-size: 16px; color: #fff; background-color: #007bff; text-decoration: none; border-radius: 5px; font-weight: bold; transition: 0.3s;">
              🔄 Réinitialiser mon mot de passe
            </a>
          </div>
    
          <p style="color: #777; font-size: 14px;">Ce lien est valide pendant <strong>24 heures</strong>. Si vous n'avez pas demandé cette action, ignorez cet e-mail.</p>
    
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #999; font-size: 12px;">⚠️ Ne partagez jamais vos informations de connexion.</p>
          <p style="color: #999; font-size: 12px;">© ${new Date().getFullYear()} TuniFlow - Tous droits réservés.</p>
        </div>
      </div>
    `,
    
    
    };

    // Envoyer l'email
    await transporter.sendMail(mailOptions);

    res.json({ message: "Lien de réinitialisation envoyé par e-mail" });
  } catch (err) {
    console.error("Erreur dans forgotPassword:", err);
    res.status(500).json({ message: "Erreur interne du serveur", error: err.message });
  }
}
async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Token manquant" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.SECRET_KEY);
    } catch (err) {
      return res.status(400).json({ message: "Token invalide ou expiré" });
    }

    // Rechercher l'utilisateur par ID extrait du token
    const user = await userModel.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Hacher le nouveau mot de passe
    const hashedPassword = await bcryptjs.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Mot de passe réinitialisé avec succès" });
  } catch (err) {
    console.error("Erreur dans resetPassword:", err);
    res.status(500).json({ message: "Erreur interne du serveur", error: err.message });
  }
}

const Registerwithproject = async (req, res, projectId) => {
  try {
      // 1️⃣ Validation des données
      const { errors, isValid } = validateRegister(req.body);
      if (!isValid) {
          return res.status(400).json(errors);
      }

      // 2️⃣ Vérifier si l'utilisateur existe déjà
      const exist = await userModel.findOne({ email: req.body.email });
      if (exist) {
          return res.status(409).json({ email: "Utilisateur déjà existant" });
      }

      // 3️⃣ Vérifier si le projet existe
      const project = await Project.findById(projectId);
      if (!project) {
          return res.status(404).json({ projectId: "Projet non trouvé" });
      }

      // 4️⃣ Hachage du mot de passe
      req.body.password = await bcryptjs.hash(req.body.password, 10);

      // 5️⃣ Sélection du modèle en fonction du rôle
      let userType;
      switch (req.body.role) {
          case "BUSINESS_OWNER":
              userType = new BusinessOwner({
                  email: req.body.email,
                  password: req.body.password,
                  fullname: req.body.fullname,
                  lastname: req.body.lastname,
                  role: req.body.role,
                  project: projectId // Ajout de l'ID du projet
              });
              break;

          case "ACCOUNTANT":
              userType = new Accountant({
                  email: req.body.email,
                  password: req.body.password,
                  fullname: req.body.fullname,
                  lastname: req.body.lastname,
                  role: req.body.role,
                  project: projectId // Ajout de l'ID du projet
              });
              break;

          case "RH":
              userType = new RH({
                  email: req.body.email,
                  password: req.body.password,
                  fullname: req.body.fullname,
                  lastname: req.body.lastname,
                  role: req.body.role,
                  project: projectId // Ajout de l'ID du projet
              });
              break;

          case "FINANCIAL_MANAGER":
              userType = new FinancialManager({
                  email: req.body.email,
                  password: req.body.password,
                  fullname: req.body.fullname,
                  lastname: req.body.lastname,
                  role: req.body.role,
                  project: projectId // Ajout de l'ID du projet
              });
              break;

          case "BUSINESS_MANAGER":
              userType = new BusinessManager({
                  email: req.body.email,
                  password: req.body.password,
                  fullname: req.body.fullname,
                  lastname: req.body.lastname,
                  role: req.body.role,
                  project: projectId // Ajout de l'ID du projet
              });
              break;

          default:
              return res.status(400).json({ role: "Rôle invalide" });
      }

      // 6️⃣ Sauvegarde de l'utilisateur
      const result = await userType.save();

      // 7️⃣ Ajouter l'utilisateur au projet
      switch (req.body.role) {
          case "BUSINESS_OWNER":
              project.businessOwner = result._id;
              break;
          case "ACCOUNTANT":
              project.accountants.push(result._id);
              break;
          case "RH":
              project.rhManagers.push(result._id);
              break;
          case "FINANCIAL_MANAGER":
              project.financialManagers.push(result._id);
              break;
          case "BUSINESS_MANAGER":
              project.businessManager = result._id;
              break;
      }

      await project.save();

      // 8️⃣ Réponse
      res.status(201).json({ message: "Inscription réussie", user: result });

  } catch (error) {
      console.error("Erreur lors de l'inscription:", error);
      res.status(500).json({ message: "Erreur interne du serveur", error });
  }
};
  
 // Ajouter des employés à partir d'un fichier Excel
 const addEmployeesFromExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier fourni' });
    }

    // Récupérer le token JWT de l'en-tête Authorization
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: 'Token manquant' });
    }

    // Décoder le token pour récupérer l'ID de l'utilisateur
    const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
    const userId = decodedToken.userId; // Récupérer l'ID de l'utilisateur

    if (!userId) {
      return res.status(400).json({ message: "ID de l'utilisateur manquant dans le token" });
    }

    // Récupérer l'utilisateur dans la base de données
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier si l'utilisateur est de type RH
    if (user.userType !== "RH") {
      return res.status(400).json({ message: "L'utilisateur connecté n'est pas de type RH" });
    }

    // Récupérer l'ID du projet (uniquement pour les RH)
    const projectId = user.project;
    if (!projectId) {
      return res.status(400).json({ message: "Aucun projet associé à l'utilisateur connecté" });
    }

    // Lire le fichier Excel
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const employeesData = xlsx.utils.sheet_to_json(worksheet);

    // Valider les données des employés
    const employees = [];
    for (const emp of employeesData) {
      if (!emp.password) {
        console.warn(`Employé ${emp.name || 'sans nom'} ignoré : mot de passe manquant`);
        continue; // Ignorer les employés sans mot de passe
      }

      // Hasher le mot de passe
      const hashedPassword = await bcryptjs.hash(emp.password, 10);
      employees.push({
        name: emp.name,
        email: emp.email,
        password: hashedPassword,
        role: emp.role,
        project: projectId // Ajouter l'ID du projet
      });
    }

    // Insérer les employés dans la base de données
    if (employees.length > 0) {
      await Employe.insertMany(employees);
      return res.status(201).json({ message: 'Employés ajoutés avec succès' });
    } else {
      return res.status(400).json({ message: 'Aucun employé valide à ajouter' });
    }
  } catch (error) {
    console.error("Erreur lors de l'ajout des employés :", error);
    res.status(500).json({ message: 'Erreur interne du serveur', error });
  }
};
  
async function getAllempl(req,res) {
  try{
      const data = await Employe.find()
      res.send(data);
  }
  catch(err){
      res.send(err);
  }
}
async function downloadEvidence(req, res) {
  try {
    const fileName = req.params.fileName;
    const filePath = path.join(__dirname, 'public', 'evidences', fileName); // Exemple de chemin

    // Vérifie si le fichier existe
    try {
      await fs.access(filePath);  // Vérifie si le fichier existe (fonction asynchrone)
      
      // Si le fichier existe, renvoyer le fichier en téléchargement
      res.download(filePath, fileName, (err) => {
        if (err) {
          console.error('Erreur lors du téléchargement:', err);
          return res.status(500).send('Erreur lors du téléchargement du fichier');
        }
      });

    } catch (error) {
      console.error('Fichier non trouvé:', error);
      return res.status(404).send('Fichier non trouvé');
    }
  } catch (error) {
    console.error('Erreur lors de la gestion du téléchargement:', error);
    return res.status(500).send('Erreur serveur');
  }};
const addEmployee = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Tous les champs sont obligatoires' });
    }

    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: 'Token manquant' });
    }

    const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
    const userId = decodedToken.userId;

    if (!userId) {
      return res.status(400).json({ message: "ID de l'utilisateur manquant dans le token" });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    if (user.userType !== "RH") {
      return res.status(400).json({ message: "L'utilisateur connecté n'est pas de type RH" });
    }

    const projectId = user.project;
    if (!projectId) {
      return res.status(400).json({ message: "Aucun projet associé à l'utilisateur connecté" });
    }

    const existingEmployee = await Employe.findOne({ email });
    if (existingEmployee) {
      return res.status(400).json({ message: 'Un employé avec cet email existe déjà' });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);

    const newEmployee = new Employe({
      name,
      email,
      password: hashedPassword,
      role,
      project: projectId
    });

    await newEmployee.save();

    // Mettre à jour le projet pour inclure l'ID du nouvel employé
    await Project.findByIdAndUpdate(projectId, {
      $push: { employees: newEmployee._id }
    });

    res.status(201).json({ message: 'Employé ajouté avec succès', employee: newEmployee });
  } catch (error) {
    console.error("Erreur lors de l'ajout de l'employé :", error);
    res.status(500).json({ message: 'Erreur interne du serveur', error });
  }
};


module.exports = {
    Register,Login,getAll,
    findMyProfile,deleteprofilbyid,deletemyprofile,
    acceptAutorisation,updateProfile,AddPicture,getBusinessOwnerFromToken,
    getAllBusinessManagers,getAllAccountants,getAllFinancialManagers,getAllRH,findMyProject,Registerwithproject,
    resetPassword,forgotPassword,verifyCode,sendVerificationCode,getAllempl,addEmployeesFromExcel,getAllBusinessOwners,addEmployee,downloadEvidence
};
