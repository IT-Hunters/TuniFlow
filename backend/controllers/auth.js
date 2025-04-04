const bcryptjs = require("bcryptjs");
const userModel = require("../model/user");
const validateRegister = require("../validation/registerValidation");
const validateLogin = require("../validation/login.validator");
const validateUpdateProfil = require("../validation/updateprofil");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const multerPicture = require("../config/multer-picture");
const uploadPicture = multerPicture.single("picture");
require('dotenv').config();
const jwt = require("jsonwebtoken");
const xlsx = require('xlsx');
// Import des modèles discriminants

const walletController = require("../controllers/walletcontroller");
const FinancialManager = require("../model/FinancialManager");
const BusinessOwner = require("../model/BusinessOwner");
const Accountant = require("../model/Accountant");
const BusinessManager = require("../model/BusinessManager");
const RH = require("../model/RH");
const Project = require("../model/Project");
const Employe = require('../model/Employe');
const nodemailer = require('nodemailer');
const { createLog } = require("./UserLogsController");

async function getAll(req, res) {
    try {
        const data = await userModel.find();
        res.send(data);
    } catch (err) {
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
            return res.status(409).json({ email: "User already exists" });
        }

        // 3️⃣ Hachage du mot de passe
        req.body.password = await bcryptjs.hash(req.body.password, 10);

        // 4️⃣ Sélection du modèle en fonction du rôle
        let userType;
        let UserModel;
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
                return res.status(400).json({ role: "Invalid role" });
        }

        // 5️⃣ Sauvegarde de l'utilisateur
        const result = await userType.save();

        // 6️⃣ Création automatique d'un wallet
        if (["BUSINESS_OWNER", "BUSINESS_MANAGER", "ACCOUNTANT", "FINANCIAL_MANAGER"].includes(req.body.role)) {
            const walletData = {
                user_id: result._id,
                type: "Principal"
            };
            const walletReq = { body: walletData };
            const walletRes = {
                status: (code) => ({
                    json: async (data) => {
                        if (code === 201) {
                            console.log("Wallet created successfully in Register:", data);
                            await UserModel.findByIdAndUpdate(result._id, { wallet: data.wallet._id });
                            result.wallet = data.wallet._id;
                        } else {
                            console.error("Error creating wallet:", data);
                        }
                    }
                })
            };
            await walletController.addWallet(walletReq, walletRes);
        }

       // 7️⃣ Création automatique d'un chat pour Business Owner avec l'Admin
if (req.body.role === "BUSINESS_OWNER") {
    const adminId = "67bee9c72a104f8241d58e7d"; // ID fixe de l'Admin
    try {
        // Vérifier si un chat existe déjà
        let chat = await Chat.findOne({
            participants: { $all: [result._id, adminId] }
        });

        if (!chat) {
            // Créer le chat directement
            chat = new Chat({
                participants: [result._id, adminId],
                messages: [],
                createdBy: "System",
                createdAt: new Date()
            });
            await chat.save();
            console.log("Chat créé automatiquement:", {
                chatId: chat._id,
                participants: chat.participants
            });

            // Émettre l'événement Socket.IO si disponible
            if (global.io) {
                global.io.emit("newChat", {
                    chatId: chat._id,
                    participants: chat.participants
                });
            }
        } else {
            console.log("Chat existant trouvé:", chat);
        }
    } catch (chatError) {
        console.error("Erreur lors de la création automatique du chat:", chatError);
    }
}
        // 8️⃣ Réponse avec l'utilisateur créé
        res.status(201).json({ message: "Registration successful", user: result });

    } catch (error) {
        console.error("Error during registration:", error);
        res.status(500).json({ message: "Internal server error", error });
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
            return res.status(404).json({ message: 'User not found' });
        }

        const match = await bcryptjs.compare(req.body.password, existUser.password);
        if (!match) {
            return res.status(401).json({ message: 'Invalid password' });
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
        console.error('Error during login:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const updateFirstLogin = async (userId) => {
    try {
        // Trouver l'utilisateur par son ID
        const user = await userModel.findById(userId);

        if (!user) {
            throw new Error("User not found");
        }

        // Vérifier si firstlogin est true
        if (user.firstlogin === true) {
            user.firstlogin = false; // Mettre à jour firstlogin à false
            await user.save(); // Sauvegarder les modifications
            console.log(`firstlogin updated to false for user: ${userId}`);
            return { success: true, message: "firstlogin updated to false" };
        } else {
            console.log(`firstlogin is already false for user: ${userId}`);
            return { success: false, message: "firstlogin is already false" };
        }
    } catch (error) {
        console.error("Error updating firstlogin:", error.message);
        throw error;
    }
};

const logout = (req, res) => {
    try {
        // Extract token from the Authorization header
        const token = req.headers.authorization?.split(' ')[1]; // Token comes as "Bearer <token>"
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
    const userId = req.user.userId;
    const updates = req.body;

    console.log('User ID:', userId);
    console.log('Received data:', updates);

    try {
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        console.log('User role:', user.role);

        const { errors, isValid } = validateUpdateProfil(updates, user.role);
        console.log('Validation result:', { errors, isValid });

        if (!isValid) {
            return res.status(400).json(errors);
        }

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
                    { $set: { ...updates, isFirstUpdate: false } },
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
                return res.status(400).json({ message: "Invalid user role" });
        }

        return res.status(200).json({ message: "User updated successfully" });
    } catch (error) {
        console.error("Detailed error:", error.stack); // Afficher la stacktrace complète
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

/* *************************************************/
async function findMyProfile(req, res) {
    try {
        // Vérifie si l'ID utilisateur est présent dans req.user
        if (!req.user || !req.user.userId) {
            return res.status(400).json({ message: 'User ID missing' });
        }

        // Vérifie si l'ID utilisateur est un ObjectId valide
        if (!mongoose.isValidObjectId(req.user.userId)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        // Convertit l'ID utilisateur en ObjectId
        const userId = new mongoose.Types.ObjectId(req.user.userId);
        console.log('User ID:', userId);

        // Recherche l'utilisateur par son _id
        const user = await userModel.findById(userId).select("-password");

        // Si l'utilisateur n'est pas trouvé
        if (!user) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        // Si l'utilisateur est trouvé
        console.log('Profile found:', user);
        res.status(200).json(user);
    } catch (err) {
        console.error('Error in findMyProfile:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
/****************************** */
const findMyPicture = async (req, res) => {
    try {
        // Vérifie si l'ID utilisateur est présent dans req.user
        if (!req.user || !req.user.userId) {
            return res.status(400).json({ message: 'User ID missing' });
        }

        // Vérifie si l'ID utilisateur est un ObjectId valide
        if (!mongoose.isValidObjectId(req.user.userId)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        // Convertit l'ID utilisateur en ObjectId
        const userId = new mongoose.Types.ObjectId(req.user.userId);
        console.log('User ID:', userId);

        // Recherche l'utilisateur par son _id et sélectionne uniquement le champ 'picture'
        const user = await userModel.findById(userId).select("picture");

        // Si l'utilisateur n'est pas trouvé
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Si l'utilisateur est trouvé
        console.log('Profile picture found:', user.picture);
        res.status(200).json({ picture: user.picture });
    } catch (err) {
        console.error('Error in findMyPicture:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

/*  *****************************/
async function deleteprofilbyid(req, res) {
    try {
        const data = await profileModel.findById({ _id: req.params.id });
        res.status(200).json({
            message: "Profile deleted successfully"
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
                return res.status(400).json({ message: 'User ID missing' });
            }

            console.log('User ID:', req.user.userId);
            console.log('Uploaded file name:', req.file.filename);

            // Récupérer l'utilisateur pour déterminer son type
            const user = await userModel.findById(req.user.userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Accéder au modèle discriminé via userModel.discriminators
            const userDiscriminator = userModel.discriminators[user.userType];
            if (!userDiscriminator) {
                return res.status(400).json({ message: 'Unsupported user type' });
            }

            // Mettre à jour le profil avec l'image
            const data = await userDiscriminator.findOneAndUpdate(
                { _id: req.user.userId }, // Utilisez _id pour trouver l'utilisateur
                { $set: { picture: req.file.filename } }, // Mettre à jour le champ picture
                { new: true }
            ).catch(err => {
                console.error('Error updating profile:', err);
                throw err;
            });

            if (!data) {
                return res.status(404).json({ message: 'Profile not found' });
            }

            console.log('Updated data:', data);
            return res.status(201).json({ message: 'Picture added successfully', data });
        });
    } catch (error) {
        res.status(500).json(error);
    }
};
/************ deletemyprofile *********** */
async function deletemyprofile(req, res) {
    console.log('req.user in deletemyprofile:', req.user);
    try {
        if (!req.user || !req.user.userId) {
            console.error('User ID missing in req.user:', req.user);
            return res.status(400).json({ message: 'User ID missing' });
        }

        if (!mongoose.isValidObjectId(req.user.userId)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        const userId = new mongoose.Types.ObjectId(req.user.userId);
        console.log('User ID:', userId);

        // Vérification de l'existence de l'utilisateur
        const userExists = await userModel.findById(userId);
        console.log('User exists:', userExists);
        if (!userExists) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        // Suppression de l'utilisateur
        const deletedProfile = await userModel.findOneAndDelete({ _id: userId }).populate({
            path: "user",
            select: "-password"
        });

        if (!deletedProfile) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        console.log('Profile deleted:', deletedProfile);
        res.status(200).json({ message: 'Profile deleted successfully', deletedProfile });
    } catch (err) {
        console.error('Error in deletemyprofile:', err);
        res.status(500).json({ message: 'An error occurred' });
    }
}

const acceptAutorisation = async (req, res) => {
    const { id } = req.params; // ID du BusinessOwner

    try {
        // Trouver le BusinessOwner par son ID
        const owner = await BusinessOwner.findById(id);
        if (!owner) {
            return res.status(404).json({ message: "BusinessOwner not found" });
        }

        // Mettre à jour directement l'autorisation à true
        owner.autorization = true;
        await owner.save();

        // Répondre avec l'utilisateur mis à jour
        res.status(200).json({ message: "Authorization granted", owner });
    } catch (error) {
        console.error("Error updating authorization:", error);
        res.status(500).json({ message: "Server error" });
    }
};

async function getBusinessOwnerFromToken(token) {
    try {
        // Décoder le token pour obtenir l'ID du BusinessOwner
        const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
        if (!decodedToken) {
            throw new Error("Invalid token");
        }

        // Récupérer le BusinessOwner à partir de l'ID
        const businessOwner = await BusinessOwner.findById(decodedToken.userId);
        if (!businessOwner) {
            throw new Error("BusinessOwner not found");
        }

        return businessOwner;
    } catch (error) {
        throw new Error(`Error retrieving BusinessOwner: ${error.message}`);
    }
}

const getAllBusinessManagers = async (req, res) => {
    try {
        const businessManagers = await userModel.find({ userType: 'BusinessManager' });

        if (!businessManagers || businessManagers.length === 0) {
            return res.status(404).json({ message: 'No Business Managers found' });
        }

        res.status(200).json(businessManagers);
    } catch (error) {
        console.error("Error retrieving Business Managers:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getAllBusinessOwners = async (req, res) => {
    try {
        const businessOwners = await userModel.find({ userType: 'BusinessOwner' });

        if (!businessOwners || businessOwners.length === 0) {
            return res.status(404).json({ message: 'No Business Owners found' });
        }

        res.status(200).json(businessOwners);
    } catch (error) {
        console.error("Error retrieving Business Owners:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getAllRH = async (req, res) => {
    try {
        const rhs = await userModel.find({ userType: 'RH' });

        if (!rhs || rhs.length === 0) {
            return res.status(404).json({ message: 'No RH found' });
        }

        res.status(200).json(rhs);
    } catch (error) {
        console.error("Error retrieving RH:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getAllFinancialManagers = async (req, res) => {
    try {
        const financialManagers = await userModel.find({ userType: 'FinancialManager' });

        if (!financialManagers || financialManagers.length === 0) {
            return res.status(404).json({ message: 'No Financial Managers found' });
        }

        res.status(200).json(financialManagers);
    } catch (error) {
        console.error("Error retrieving Financial Managers:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getAllAccountants = async (req, res) => {
    try {
        const accountants = await userModel.find({ userType: 'Accountant' });

        if (!accountants || accountants.length === 0) {
            return res.status(404).json({ message: 'No Accountants found' });
        }

        res.status(200).json(accountants);
    } catch (error) {
        console.error("Error retrieving Accountants:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

async function findMyProject(req, res) {
    try {
        // Récupérer l'ID du BusinessManager depuis le token
        const businessManagerId = req.user.userId;
        console.log("BusinessManager ID:", businessManagerId);

        // Trouver le BusinessManager avec son projet associé
        const manager = await userModel.findById(businessManagerId)
            .populate({
                path: 'project',
                populate: [
                    { path: 'businessOwner', select: 'fullname email' },
                    { path: 'accountants', select: 'fullname email' },
                    { path: 'financialManagers', select: 'fullname email' },
                    { path: 'rhManagers', select: 'fullname email' },
                    { path: 'taxes' }, // Ajouter la population des taxes
                    { path: 'assets_actif' }
                ]
            });

        if (!manager) {
            return res.status(404).json({ message: "BusinessManager not found" });
        }

        if (!manager.project) {
            return res.status(404).json({ message: "No project assigned to this manager" });
        }

        // Formater la réponse
        const projectData = {
            id: manager.project._id,
            name: `Project ${manager.project._id.toString().slice(-4)}`, // Nom générique
            description: `Managed by ${manager.fullname}`,
            status: manager.project.status,
            amount: manager.project.amount,
            startDate: manager.project.createdAt, // Utilise la date de création
            endDate: manager.project.due_date,
            businessOwner: manager.project.businessOwner,
            teamMembers: {
                accountants: manager.project.accountants,
                financialManagers: manager.project.financialManagers,
                rhManagers: manager.project.rhManagers
            },
        
            taxes: manager.project.taxes,
            assets_actif: manager.project.assets_actif
        };

        res.status(200).json(projectData);
    } catch (error) {
        console.error("Error in findMyProject:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
}

const findMyProjectsOwner = async (req, res) => {
    try {
        const userId = req.user.userId; // L'ID de l'utilisateur est extrait du token après authentification

        // Trouver l'utilisateur dans la base de données pour obtenir le projet associé
        const user = await userModel.findById(userId).populate('projects'); // On suppose que 'project' est une référence à un autre modèle

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.projects) {
            return res.status(404).json({ message: 'No projects found for this user' });
        }

        // Si un projet est trouvé, on le retourne dans la réponse
        res.status(200).json(user.projects);
    } catch (error) {
        console.error("Error retrieving projects:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Envoi du code de vérification par e-mail
async function sendVerificationCode(req, res) {
    try {
        const { email } = req.body;
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const code = Math.floor(100000 + Math.random() * 900000); // Code 6 chiffres
        verificationCodes[email] = code;

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Verification Code",
            text: `Your verification code is: ${code}`,
        });

        res.json({ message: "Code sent via email" });
    } catch (err) {
        res.status(500).json({ message: "Error sending code", error: err });
    }
}

async function verifyCode(req, res) {
    const { email, code } = req.body;

    try {
        // Vérifier si le code est valide pour l'utilisateur
        const storedCode = verificationCodes[email];

        if (!storedCode) {
            return res.status(404).json({ message: "No verification code found for this user" });
        }

        if (parseInt(code) === storedCode) {
            // Code vérifié avec succès, tu peux ici faire des actions supplémentaires
            return res.status(200).json({ message: "Code verified successfully" });
        } else {
            return res.status(400).json({ message: "Incorrect verification code" });
        }
    } catch (err) {
        res.status(500).json({ message: "Error verifying code", error: err });
    }
}

async function forgotPassword(req, res) {
    try {
        const { email } = req.body;
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
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

        res.json({ message: "Password reset link sent via email" });
    } catch (err) {
        console.error("Error in forgotPassword:", err);
        res.status(500).json({ message: "Internal server error", error: err.message });
    }
}

async function resetPassword(req, res) {
    try {
        const { token, newPassword } = req.body;

        if (!token) {
            return res.status(400).json({ message: "Token missing" });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.SECRET_KEY);
        } catch (err) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        // Rechercher l'utilisateur par ID extrait du token
        const user = await userModel.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Hacher le nouveau mot de passe
        const hashedPassword = await bcryptjs.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.json({ message: "Password reset successfully" });
    } catch (err) {
        console.error("Error in resetPassword:", err);
        res.status(500).json({ message: "Internal server error", error: err.message });
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
            return res.status(409).json({ email: "User already exists" });
        }

        // 3️⃣ Récupérer l'ID de l'utilisateur connecté à partir du token
        const token = req.headers.authorization.split(" ")[1];
        const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
        const userId = decodedToken.userId;

        // 4️⃣ Vérifier que l'utilisateur connecté est un BusinessManager
        const businessManager = await BusinessManager.findById(userId);
        if (!businessManager || businessManager.role !== "BUSINESS_MANAGER") {
            return res.status(403).json({ message: "Access denied. Only a Business Manager can register users." });
        }

        // 5️⃣ Récupérer l'ID du projet associé au BusinessManager
        const projectId = businessManager.project;
        if (!projectId) {
            return res.status(404).json({ message: "No project associated with this Business Manager" });
        }

        // 6️⃣ Vérifier si le projet existe
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ projectId: "Project not found" });
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
                break;

            default:
                return res.status(400).json({ role: "Invalid role" });
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
            subject: "👋 Welcome to our platform!",
            html: `
              <div style="background-color: #f4f4f4; padding: 20px; font-family: Arial, sans-serif;">
                  <div style="max-width: 600px; background: #fff; margin: auto; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); text-align: center;">
                      
                      <!-- Logo -->
                      <div style="text-align: center; margin-bottom: 20px;">
                          <img src="https://www.futuronomics.com/wp-content/uploads/2024/07/best-1024x576.png" 
                               alt="TuniFlow Logo" style="max-width: 150px; border-radius: 10px;">
                      </div>
                  
                      <h2 style="color: #333;">🎉 Welcome to our platform!</h2>
                      <p style="color: #555;">Hello ${req.body.fullname},</p>
                      <p style="color: #555;">Your account has been successfully created as <strong>${req.body.role}</strong>.</p>
                      <p style="color: #555;">Here are your login details:</p>
                      <p style="color: #555;"><strong>Email:</strong> ${req.body.email}</p>
                      <p style="color: #555;"><strong>Password:</strong> ${req.body.password}</p>
                      <p style="color: #555;">We recommend changing your password after your first login.</p>
                  
                      <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
                      <p style="color: #999; font-size: 12px;">© ${new Date().getFullYear()} TuniFlow - All rights reserved.</p>
                  </div>
              </div>
          `,
        };

        await transporter.sendMail(mailOptions);

        await project.save();

        // 1️⃣2️⃣ Réponse
        res.status(201).json({ message: "Registration successful", user: result });

    } catch (error) {
        console.error("Error during registration:", error);
        res.status(500).json({ message: "Internal server error", error });
    }
};

// Ajouter des employés à partir d'un fichier Excel
const addEmployeesFromExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file provided' });
        }

        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'Authorization header missing' });
        }

        const token = authHeader.split(" ")[1];
        const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
        const userId = decodedToken.userId;

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.userType !== "RH") {
            return res.status(400).json({ message: "The logged-in user is not of type RH" });
        }

        const projectId = user.project;
        if (!projectId) {
            return res.status(400).json({ message: "No project associated with the logged-in user" });
        }

        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const employeesData = xlsx.utils.sheet_to_json(worksheet);

        const employees = [];
        for (const emp of employeesData) {
            if (!emp.password) {
                console.warn(`Employee ${emp.name || 'unnamed'} skipped: password missing`);
                continue;
            }

            const hashedPassword = await bcryptjs.hash(emp.password, 10);
            employees.push({
                name: emp.name,
                email: emp.email,
                password: hashedPassword,
                role: emp.role,
                project: projectId
            });
        }

        if (employees.length > 0) {
            const insertedEmployees = await Employe.insertMany(employees);

            const employeeIds = insertedEmployees.map(emp => emp._id);

            await Project.findByIdAndUpdate(
                projectId,
                { $push: { employees: { $each: employeeIds } } }
            );

            return res.status(201).json({ message: 'Employees added successfully', employees: insertedEmployees });
        } else {
            return res.status(400).json({ message: 'No valid employees to add' });
        }
    } catch (error) {
        console.error("Error adding employees:", error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};

async function getAllempl(req, res) {
    try {
        const data = await Employe.find();
        res.send(data);
    } catch (err) {
        res.send(err);
    }
}

async function getbyid(req, res) {
    try {
        const data = await userModel.findById(req.params.id);
        res.send(data);
    } catch (err) {
        res.send(err);
    }
}

async function deleteById(req, res) {
    try {
        const data = await userModel.findByIdAndDelete(req.params.id);
        if (!data) {
            return res.status(404).send({ message: "User not found" });
        }
        res.send({ message: "User deleted successfully", data });
    } catch (err) {
        res.status(500).send(err);
    }
}

async function updateById(req, res) {
    try {
        const { fullname, lastname, email } = req.body;  // Récupère les données depuis le corps de la requête

        const updatedUser = await userModel.findByIdAndUpdate(
            req.params.id,           // L'ID de l'utilisateur à mettre à jour
            { fullname, lastname, email },   // Les nouvelles données envoyées dans le corps de la requête
            { new: true }             // Retourner le document mis à jour plutôt que l'original
        );

        if (!updatedUser) {
            return res.status(404).send({ message: "User not found" });
        }

        res.send({ message: "User updated successfully", data: updatedUser });
    } catch (err) {
        res.status(500).send(err);
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
                    console.error('Error during download:', err);
                    return res.status(500).send('Error downloading file');
                }
            });

        } catch (error) {
            console.error('File not found:', error);
            return res.status(404).send('File not found');
        }
    } catch (error) {
        console.error('Error handling download:', error);
        return res.status(500).send('Server error');
    }
};

const addEmployee = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const token = req.headers.authorization.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: 'Token missing' });
        }

        const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
        const userId = decodedToken.userId;

        if (!userId) {
            return res.status(400).json({ message: "User ID missing in token" });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.userType !== "RH") {
            return res.status(400).json({ message: "The logged-in user is not of type RH" });
        }

        const projectId = user.project;
        if (!projectId) {
            return res.status(400).json({ message: "No project associated with the logged-in user" });
        }

        const existingEmployee = await Employe.findOne({ email });
        if (existingEmployee) {
            return res.status(400).json({ message: 'An employee with this email already exists' });
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

        res.status(201).json({ message: 'Employee added successfully', employee: newEmployee });
    } catch (error) {
        console.error("Error adding employee:", error);
        res.status(500).json({ message: 'Internal server error', error });
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
            return res.status(401).json({ message: "Invalid or expired token" });
        }

        // 3️⃣ Vérifier que l'utilisateur connecté est un BusinessOwner
        const businessowner = await BusinessOwner.findById(userId);
        if (!businessowner) {
            return res.status(404).json({ message: "User not found" });
        }

        if (businessowner.role !== "BUSINESS_OWNER") {
            return res.status(403).json({ message: "Access denied. Only a Business Owner can register users" });
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
            subject: "👋 Welcome to our platform!",
            html: `
              <div style="background-color: #f4f4f4; padding: 20px; font-family: Arial, sans-serif;">
                  <div style="max-width: 600px; background: #fff; margin: auto; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); text-align: center;">
                      <h2 style="color: #333;">🎉 Welcome to our platform!</h2>
                      <p style="color: #555;">Hello ${req.body.fullname},</p>
                      <p style="color: #555;">Your account has been successfully created as <strong>${req.body.role}</strong>.</p>
                      <p style="color: #555;">Here are your login details:</p>
                      <p style="color: #555;"><strong>Email:</strong> ${req.body.email}</p>
                      <p style="color: #555;"><strong>Password:</strong> ${req.body.password}</p>
                      <p style="color: #555;">We recommend changing your password after your first login.</p>
                      <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
                      <p style="color: #999; font-size: 12px;">© ${new Date().getFullYear()} TuniFlow - All rights reserved.</p>
                  </div>
              </div>
          `,
        };

        await transporter.sendMail(mailOptions);

        // 8️⃣ Réponse
        res.status(201).json({ message: "Registration successful", user: result });

    } catch (error) {
        console.error("Error during registration:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


const getAllRoles = async (req, res) => {
    try {
        // Récupérer tous les rôles disponibles sauf BUSINESS_OWNER et BUSINESS_MANAGER
        const roles = userModel.getAllRoles();

        // Renvoyer la réponse
        res.status(200).json({ roles });
    } catch (error) {
        console.error("Error retrieving roles:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = {
    Register, Login, getAll,
    findMyProfile, deleteprofilbyid, deletemyprofile,
    acceptAutorisation, updateProfile, AddPicture, getBusinessOwnerFromToken,
    getAllBusinessManagers, getAllAccountants, getAllFinancialManagers, getAllRH, findMyProject, Registerwithproject,
    resetPassword, forgotPassword, verifyCode, sendVerificationCode, getAllempl, addEmployeesFromExcel, getAllBusinessOwners, addEmployee, downloadEvidence, RegisterManger,           // New
     getAllRoles, findMyPicture, logout, getbyid, deleteById, updateById, findMyProjectsOwner, updateFirstLogin,    // New
   
};