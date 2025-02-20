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
// Import des modèles discriminants
const FinancialManager = require("../model/FinancialManager");
const BusinessOwner = require("../model/BusinessOwner");
const Accountant = require("../model/Accountant");
const BusinessManager = require("../model/BusinessManager");
const RH = require("../model/RH");
const Project=require("../model/Project")


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
                    role: req.body.role
                  
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
    return res.status(200).json({ token: token });
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
      const { id } = req.params; // ID du BusinessManager
      const { accept } = req.body; // true ou false
    
      try {
        // Trouver le BusinessManager par son ID
        const owner = await BusinessOwner.findById(id);
        if (!owner) {
          return res.status(404).json({ message: 'BusinessOuwner non trouvé' });
        }
    
        // Appeler la méthode acceptAutorisation
        await owner.acceptAutorisation(accept);
    
        // Répondre avec le BusinessManager mis à jour
        res.status(200).json({ message: 'Autorisation mise à jour', owner });
      } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'autorisation :', error);
        res.status(500).json({ message: 'Erreur serveur' });
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

    const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY, { expiresIn: "15m" });
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Réinitialisation du mot de passe",
      text: `Cliquez ici pour réinitialiser votre mot de passe : ${resetLink}`,
    });

    res.json({ message: "Lien de réinitialisation envoyé par e-mail" });
  } catch (err) {
    res.status(500).json({ message: "Erreur interne du serveur", error: err });
  }
}
async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    const hashedPassword = await bcryptjs.hash(newPassword, 10);
    await userModel.findByIdAndUpdate(decoded.id, { password: hashedPassword });

    res.json({ message: "Mot de passe mis à jour avec succès" });
  } catch (err) {
    res.status(400).json({ message: "Lien invalide ou expiré" });
  }
}

  
 


module.exports = {
    Register,Login,getAll,
    findMyProfile,deleteprofilbyid,deletemyprofile,
    acceptAutorisation,updateProfile,AddPicture,getBusinessOwnerFromToken,
    getAllBusinessManagers,getAllAccountants,getAllFinancialManagers,getAllRH,findMyProject
};
