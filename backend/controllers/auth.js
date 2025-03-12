const bcryptjs = require("bcryptjs");
const userModel = require("../model/user");
const validateRegister = require("../validation/registerValidation");
const validateLogin= require("../validation/login.validator");
const validateUpdateProfil=require("../validation/updateprofil");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const multerPicture= require("../config/multer-picture")
const uploadPicture= multerPicture.single("picture");
require('dotenv').config();
const jwt=require("jsonwebtoken");
const xlsx = require('xlsx');
// Import des modèles discriminants

const walletController = require("../controllers/walletcontroller");
const FinancialManager = require("../model/FinancialManager");
const BusinessOwner = require("../model/BusinessOwner");
const Accountant = require("../model/Accountant");
const BusinessManager = require("../model/BusinessManager");
const RH = require("../model/RH");
const Project=require("../model/Project");
const Employe = require('../model/Employe');
const nodemailer = require('nodemailer');
const { createLog } = require("./UserLogsController"); 

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
      let UserModel; // Modèle correspondant au rôle
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
              UserModel = BusinessOwner;
              break;

          case "ACCOUNTANT":
              userType = new Accountant({
                  email: req.body.email,
                  password: req.body.password,
                  fullname: req.body.fullname,
                  lastname: req.body.lastname,
                  role: req.body.role
              });
              UserModel = Accountant;
              break;

          case "RH":
              userType = new RH({
                  email: req.body.email,
                  password: req.body.password,
                  fullname: req.body.fullname,
                  lastname: req.body.lastname,
                  role: req.body.role
              });
              UserModel = RH;
              break;

          case "FINANCIAL_MANAGER":
              userType = new FinancialManager({
                  email: req.body.email,
                  password: req.body.password,
                  fullname: req.body.fullname,
                  lastname: req.body.lastname,
                  role: req.body.role
              });
              UserModel = FinancialManager;
              break;

          case "BUSINESS_MANAGER":
              userType = new BusinessManager({
                  email: req.body.email,
                  password: req.body.password,
                  fullname: req.body.fullname,
                  lastname: req.body.lastname,
                  role: req.body.role
              });
              UserModel = BusinessManager;
              break;

          default:
              return res.status(400).json({ role: "Rôle invalide" });
      }

      // 5️⃣ Sauvegarde de l'utilisateur
      const result = await userType.save();

      // 6️⃣ Création automatique d'un wallet pour certains rôles (sauf ADMIN)
      if (["BUSINESS_OWNER", "BUSINESS_MANAGER", "ACCOUNTANT", "FINANCIAL_MANAGER"].includes(req.body.role)) {
          const walletData = {
              user_id: result._id,
              type: "Principal" // Type par défaut
          };

          // Simuler une requête pour utiliser walletController.addWallet
          const walletReq = { body: walletData };
          const walletRes = {
              status: (code) => ({
                  json: async (data) => {
                      if (code === 201) {
                          console.log("Wallet créé avec succès dans Register:", data);
                          // Utiliser le modèle approprié pour mettre à jour l'utilisateur avec l'ID du wallet
                          await UserModel.findByIdAndUpdate(result._id, { wallet: data.wallet._id });
                          result.wallet = data.wallet._id; // Mettre à jour l'instance localement
                      } else {
                          console.error("Erreur lors de la création du wallet:", data);
                      }
                  }
              })
          };

          await walletController.addWallet(walletReq, walletRes);
      }

      // 7️⃣ Réponse avec l'utilisateur créé
      res.status(201).json({ message: "Inscription réussie", user: result });

  } catch (error) {
      console.error("Erreur lors de l'inscription:", error);
      res.status(500).json({ message: "Erreur interne du serveur", error });
  }
};

const Login = async (req, res) => {
  const { errors, isValid } = validateLogin(req.body);

  if (!isValid) {
    return res.status(400).json(errors); 
  }

  try {
    const existUser = await userModel.findOne({ email: req.body.email });
    if (!existUser) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const match = await bcryptjs.compare(req.body.password, existUser.password);
    if (!match) {
      return res.status(401).json({ message: 'invalid password' });
    }

    const payload = {
      userId: existUser._id,
      fullname: existUser.fullname,
      email: existUser.email,
      role: existUser.role
    };

    const token = jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: "1d" });
    //create logs
    await createLog(existUser._id);
    // Ensure global.connectedUsers is always a Set
    if (!global.connectedUsers || !(global.connectedUsers instanceof Set)) {
      global.connectedUsers = new Set();
    }

    global.connectedUsers.add(existUser);

    global.io.emit("userOnline", Array.from(global.connectedUsers)); 

    return res.status(200).json({ token: token, role: existUser.role });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    return res.status(500).json({ message: 'Erreur interne du serveur' });
  }
};


const logout = (req, res) => {
  try {
     
    // Extract token from the Authorization header
    const token = req.headers.authorization?.split(' ')[1]; // Token comes as "Bearer <token>"
    //console.log('req' + req.headers.authorization);
    console.log(token);
    if (!token) {
      return res.status(400).json({ message: 'Token not provided' });
    }

    // Decode the token to get the userId
    const decoded = jwt.verify(token, process.env.SECRET_KEY); // You can replace SECRET_KEY with your own environment variable key
    const userId = decoded.userId; // Assuming the token contains `userId` payload

    // Clear the token from cookies (or wherever it's stored)
    res.clearCookie('token');

    // Remove user from the connectedUsers set
    global.connectedUsers = global.connectedUsers || new Set();
    global.connectedUsers = Array.from(global.connectedUsers).filter(user => user._id !== userId);

    // Emit event to notify clients that the user has logged out
    global.io.emit("userOffline", userId); 

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error during logout:', error);
    return res.status(500).json({ message: 'Internal server error' });
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

      // Valider les données en fonction du rôle
      const { errors, isValid } = validateUpdateProfil(updates, user.role);

      if (!isValid) {
          return res.status(400).json(errors); // 400 pour une requête invalide
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
/******************************  */ 
const findMyPicture = async (req, res) => {
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

    // Recherche l'utilisateur par son _id et sélectionne uniquement le champ 'picture'
    const user = await userModel.findById(userId).select("picture");

    // Si l'utilisateur n'est pas trouvé
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    // Si l'utilisateur est trouvé
    console.log('Image de profil trouvée:', user.picture);
    res.status(200).json({ picture: user.picture });
  } catch (err) {
    console.error('Erreur dans findMyPicture:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};


/*  *****************************/
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
      subject: "🔒 Reset Password",
      html: `
     <div style="background-color: #f4f4f4; padding: 20px; font-family: Arial, sans-serif;">
  <div style="max-width: 600px; background: #fff; margin: auto; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); text-align: center;">
    
    <!-- Logo -->
    <div style="text-align: center; margin-bottom: 20px;">
      <img src="https://www.futuronomics.com/wp-content/uploads/2024/07/best-1024x576.png" 
           alt="TuniFlow Logo" style="max-width: 150px; border-radius: 10px;">
    </div>

    <h2 style="color: #333;">🔐 Reset Your Password</h2>
    <p style="color: #555;">Hello,</p>
    <p style="color: #555;">Click the button below to reset your password:</p>
    
    <div style="margin: 20px 0;">
      <a href="${resetLink}" 
        style="display: inline-block; padding: 14px 24px; font-size: 16px; color: #fff; background-color: #007bff; text-decoration: none; border-radius: 5px; font-weight: bold; transition: 0.3s;">
        🔄 Reset My Password
      </a>
    </div>

    <p style="color: #777; font-size: 14px;">This link is valid for <strong>24 hours</strong>. If you did not request this action, please ignore this email.</p>

    <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
    <p style="color: #999; font-size: 12px;">⚠️ Never share your login credentials.</p>
    <p style="color: #999; font-size: 12px;">© ${new Date().getFullYear()} TuniFlow - All rights reserved.</p>
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

const Registerwithproject = async (req, res) => {
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

      // 3️⃣ Récupérer l'ID de l'utilisateur connecté à partir du token
      const token = req.headers.authorization.split(" ")[1];
      const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
      const userId = decodedToken.userId;

      // 4️⃣ Vérifier que l'utilisateur connecté est un BusinessManager
      const businessManager = await BusinessManager.findById(userId);
      if (!businessManager || businessManager.role !== "BUSINESS_MANAGER") {
          return res.status(403).json({ message: "Accès refusé. Seul un Business Manager peut enregistrer des utilisateurs." });
      }

      // 5️⃣ Récupérer l'ID du projet associé au BusinessManager
      const projectId = businessManager.project;
      if (!projectId) {
          return res.status(404).json({ message: "Aucun projet associé à ce Business Manager" });
      }

      // 6️⃣ Vérifier si le projet existe
      const project = await Project.findById(projectId);
      if (!project) {
          return res.status(404).json({ projectId: "Projet non trouvé" });
      }

      // 7️⃣ Hachage du mot de passe (toujours nécessaire pour le stockage sécurisé)
      const hashedPassword = await bcryptjs.hash(req.body.password, 10);

      // 8️⃣ Sélection du modèle en fonction du rôle
      let userType;
      switch (req.body.role) {
          case "BUSINESS_OWNER":
              userType = new BusinessOwner({
                  email: req.body.email,
                  password: hashedPassword, // Stocker le mot de passe haché
                  fullname: req.body.fullname,
                  lastname: req.body.lastname,
                  role: req.body.role,
                  project: projectId
              });
              break;

          case "ACCOUNTANT":
              userType = new Accountant({
                  email: req.body.email,
                  password: hashedPassword, // Stocker le mot de passe haché
                  fullname: req.body.fullname,
                  lastname: req.body.lastname,
                  role: req.body.role,
                  project: projectId
              });
              break;

          case "RH":
              userType = new RH({
                  email: req.body.email,
                  password: hashedPassword, // Stocker le mot de passe haché
                  fullname: req.body.fullname,
                  lastname: req.body.lastname,
                  role: req.body.role,
                  project: projectId
              });
              break;

          case "FINANCIAL_MANAGER":
              userType = new FinancialManager({
                  email: req.body.email,
                  password: hashedPassword, // Stocker le mot de passe haché
                  fullname: req.body.fullname,
                  lastname: req.body.lastname,
                  role: req.body.role,
                  project: projectId
              });
              break

          default:
              return res.status(400).json({ role: "Rôle invalide" });
      }

      // 9️⃣ Sauvegarde de l'utilisateur
      const result = await userType.save();

      // 🔟 Ajouter l'utilisateur au projet
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
         
      }

      // 1️⃣1️⃣ Envoyer un e-mail de bienvenue avec le mot de passe en clair
      const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
          },
      });

      const mailOptions = {
          from: process.env.EMAIL_USER,
          to: req.body.email,
          subject: "👋 Bienvenue sur notre plateforme !",
          html: `
              <div style="background-color: #f4f4f4; padding: 20px; font-family: Arial, sans-serif;">
                  <div style="max-width: 600px; background: #fff; margin: auto; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); text-align: center;">
                      
                      <!-- Logo -->
                      <div style="text-align: center; margin-bottom: 20px;">
                          <img src="https://www.futuronomics.com/wp-content/uploads/2024/07/best-1024x576.png" 
                               alt="TuniFlow Logo" style="max-width: 150px; border-radius: 10px;">
                      </div>
                  
                      <h2 style="color: #333;">🎉 Welcome to our platform !</h2>
                      <p style="color: #555;">Hello ${req.body.fullname},</p>
                      <p style="color: #555;">Votre compte a été créé avec succès en tant que <strong>${req.body.role}</strong>.</p>
                      <p style="color: #555;">Voici vos informations de connexion :</p>
                      <p style="color: #555;"><strong>Email :</strong> ${req.body.email}</p>
                      <p style="color: #555;"><strong>Mot de passe :</strong> ${req.body.password}</p>
                      <p style="color: #555;">Nous vous recommandons de changer votre mot de passe après votre première connexion.</p>
                  
                      <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
                      <p style="color: #999; font-size: 12px;">© ${new Date().getFullYear()} TuniFlow - Tous droits réservés.</p>
                  </div>
              </div>
          `,
      };

      await transporter.sendMail(mailOptions);
      
      await project.save();

      // 1️⃣2️⃣ Réponse
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


const RegisterManger = async (req, res) => {
  try {
      // 1️⃣ Validation des données
      const { errors, isValid } = validateRegister(req.body);
      if (!isValid) {
          return res.status(400).json(errors);
      }

      // 2️⃣ Récupérer l'ID de l'utilisateur connecté à partir du token
      const token = req.headers.authorization.split(" ")[1];
      const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
      const userId = decodedToken.userId;

      if (!userId) {
          return res.status(401).json({ message: "Token invalide ou expiré." });
      }

      // 3️⃣ Vérifier que l'utilisateur connecté est un BusinessOwner
      const businessowner = await BusinessOwner.findById(userId);
      if (!businessowner) {
          return res.status(404).json({ message: "Utilisateur non trouvé." });
      }

      if (businessowner.role !== "BUSINESS_OWNER") {
          return res.status(403).json({ message: "Accès refusé. Seul un Business Owner peut enregistrer des utilisateurs." });
      }

      // 4️⃣ Hachage du mot de passe
      const hashedPassword = await bcryptjs.hash(req.body.password, 10);

      // 5️⃣ Création du Business Manager
      const businessManager = new BusinessManager({
          email: req.body.email,
          password: hashedPassword,
          fullname: req.body.fullname,
          lastname: req.body.lastname,
          role: req.body.role,
          // project: projectId // Retirez cette ligne si vous n'avez pas de projet
      });

      // 6️⃣ Sauvegarde du Business Manager
      const result = await businessManager.save();

      // 7️⃣ Envoyer un e-mail de bienvenue (optionnel)
      const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
          },
      });

      const mailOptions = {
          from: process.env.EMAIL_USER,
          to: req.body.email,
          subject: "👋 Bienvenue sur notre plateforme !",
          html: `
              <div style="background-color: #f4f4f4; padding: 20px; font-family: Arial, sans-serif;">
                  <div style="max-width: 600px; background: #fff; margin: auto; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); text-align: center;">
                      <h2 style="color: #333;">🎉 Welcome to our platform !</h2>
                      <p style="color: #555;">Hello ${req.body.fullname},</p>
                      <p style="color: #555;">Votre compte a été créé avec succès en tant que <strong>${req.body.role}</strong>.</p>
                      <p style="color: #555;">Voici vos informations de connexion :</p>
                      <p style="color: #555;"><strong>Email :</strong> ${req.body.email}</p>
                      <p style="color: #555;"><strong>Mot de passe :</strong> ${req.body.password}</p>
                      <p style="color: #555;">Nous vous recommandons de changer votre mot de passe après votre première connexion.</p>
                      <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
                      <p style="color: #999; font-size: 12px;">© ${new Date().getFullYear()} TuniFlow - Tous droits réservés.</p>
                  </div>
              </div>
          `,
      };

      await transporter.sendMail(mailOptions);

      // 8️⃣ Réponse
      res.status(201).json({ message: "Inscription réussie", user: result });

  } catch (error) {
      console.error("Erreur lors de l'inscription:", error);
      res.status(500).json({ message: "Erreur interne du serveur" });
  }
};





const startChat = async (req, res) => {
  try {
    const { recipientId, projectId } = req.body; // projectId est maintenant optionnel
    const senderId = req.user.userId; // From JWT middleware

    // Vérifier que l'expéditeur est un BusinessOwner
    const sender = await BusinessOwner.findById(senderId);
    if (!sender || sender.role !== "BUSINESS_OWNER") {
      return res.status(403).json({ message: "Only Business Owners can start chats with Admin" });
    }

    // Vérifier que le destinataire est un Admin
    const recipient = await userModel.findById(recipientId);
    if (!recipient || recipient.role !== "ADMIN") {
      return res.status(400).json({ message: "Recipient must be an Admin" });
    }

    // Vérifier si un chat existe déjà entre ces deux utilisateurs
    let chat = await Chat.findOne({
      participants: { $all: [senderId, recipientId] }
    });

    if (!chat) {
      chat = new Chat({
        project: projectId || null, // Si projectId n'est pas fourni, mettre null
        participants: [senderId, recipientId],
        messages: []
      });
      await chat.save();
    }

    res.status(200).json({ message: "Chat started", chat });
  } catch (error) {
    console.error("Error starting chat:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Send a message
const sendMessage = async (req, res) => {
  try {
    const { chatId, content } = req.body;
    const senderId = req.user.userId;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Verify sender is a participant
    if (!chat.participants.includes(senderId)) {
      return res.status(403).json({ message: "You are not a participant in this chat" });
    }

    const message = {
      sender: senderId,
      content,
      timestamp: new Date()
    };

    chat.messages.push(message);
    await chat.save();

    res.status(200).json({ message: "Message sent", chat });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get chat history
const getChatHistory = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.userId;

    const chat = await Chat.findById(chatId).populate("participants", "fullname email").populate("messages.sender", "fullname");
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Verify user is a participant
    if (!chat.participants.some(p => p._id.toString() === userId)) {
      return res.status(403).json({ message: "You are not authorized to view this chat" });
    }

    res.status(200).json(chat);
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ message: "Server error" });
  }
};
const getAllRoles = async (req, res) => {
  try {
    // Récupérer tous les rôles disponibles sauf BUSINESS_OWNER et BUSINESS_MANAGER
    const roles = userModel.getAllRoles();

    // Renvoyer la réponse
    res.status(200).json({ roles });
  } catch (error) {
    console.error("Erreur lors de la récupération des rôles :", error);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

module.exports = {
    Register,Login,getAll,
    findMyProfile,deleteprofilbyid,deletemyprofile,
    acceptAutorisation,updateProfile,AddPicture,getBusinessOwnerFromToken,
    getAllBusinessManagers,getAllAccountants,getAllFinancialManagers,getAllRH,findMyProject,Registerwithproject,
    resetPassword,forgotPassword,verifyCode,sendVerificationCode,getAllempl,addEmployeesFromExcel,getAllBusinessOwners,addEmployee,downloadEvidence,RegisterManger,startChat,          // New
    sendMessage,getAllRoles,findMyPicture,logout,      // New
    getChatHistory};



