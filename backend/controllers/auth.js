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
const { createNotification } = require('../controllers/NotificationController');
const walletController = require("../controllers/walletcontroller");
const FinancialManager = require("../model/FinancialManager");
const ProjectConversation= require("../model/ProjectConversation");
const BusinessOwner = require("../model/BusinessOwner");
const Accountant = require("../model/Accountant");
const BusinessManager = require("../model/BusinessManager");
const RH = require("../model/RH");
const Project = require("../model/Project");
const Employe = require('../model/Employe');
const Wallet = require('../model/wallet');
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
        const hashedPassword = await bcryptjs.hash(req.body.password, 10);

        // 4️⃣ Sélection du modèle en fonction du rôle
        let userType;
        let UserModel;
        switch (req.body.role) {
            case "BUSINESS_OWNER":
                userType = new BusinessOwner({
                    email: req.body.email,
                    password: hashedPassword,
                    fullname: req.body.fullname,
                    lastname: req.body.lastname,
                    role: req.body.role,
                    evidence: req.file ? req.file.path : null,
                    firstlogin: true // Set default firstlogin
                });
                UserModel = BusinessOwner;
                break;

            case "ACCOUNTANT":
                userType = new Accountant({
                    email: req.body.email,
                    password: hashedPassword,
                    fullname: req.body.fullname,
                    lastname: req.body.lastname,
                    role: req.body.role,
                    firstlogin: true
                });
                UserModel = Accountant;
                break;

            case "RH":
                userType = new RH({
                    email: req.body.email,
                    password: hashedPassword,
                    fullname: req.body.fullname,
                    lastname: req.body.lastname,
                    role: req.body.role,
                    firstlogin: true
                });
                UserModel = RH;
                break;

            case "FINANCIAL_MANAGER":
                userType = new FinancialManager({
                    email: req.body.email,
                    password: hashedPassword,
                    fullname: req.body.fullname,
                    lastname: req.body.lastname,
                    role: req.body.role,
                    firstlogin: true
                });
                UserModel = FinancialManager;
                break;

            case "BUSINESS_MANAGER":
                userType = new BusinessManager({
                    email: req.body.email,
                    password: hashedPassword,
                    fullname: req.body.fullname,
                    lastname: req.body.lastname,
                    role: req.body.role,
                    firstlogin: true
                });
                UserModel = BusinessManager;
                break;

            default:
                return res.status(400).json({ role: "Invalid role" });
        }

        // 5️⃣ Sauvegarde de l'utilisateur
        const result = await userType.save();

        // 6️⃣ Créer un Wallet pour l'utilisateur
        const wallet = new Wallet({
            user_id: result._id,
            type: "default",
            balance: 0,
            currency: "TND"
        });
        await wallet.save();
        console.log("Wallet created for user:", wallet);

        // 7️⃣ Associer le wallet à l'utilisateur
        result.wallet_id = wallet._id;
        await result.save();
        console.log("Wallet assigned to user:", result._id);

        // 8️⃣ Envoyer un e-mail de bienvenue
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
                      <p style="color: #999; font-size: 12px;">© ${new Date().getYear()} TuniFlow - All rights reserved.</p>
                  </div>
              </div>
            `,
        };

        await transporter.sendMail(mailOptions);

        // 9️⃣ Créer une notification si l'utilisateur est affecté à un projet
        if (req.body.projectId) {
            const message = `Vous avez été affecté au projet ${req.body.projectId}`;
            const notification = await createNotification(result._id, message, req.body.projectId);
            if (global.io) {
                global.io.to(result._id.toString()).emit("newNotification", notification);
            }
        }

        // 10️⃣ Création automatique d'un chat pour Business Owner avec l'Admin
        if (req.body.role === "BUSINESS_OWNER") {
            const adminId = "67bee9c72a104f8241d58e7d";
            try {
                let chat = await Chat.findOne({
                    participants: { $all: [result._id, adminId] }
                });

                if (!chat) {
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

        // 11️⃣ Réponse avec l'utilisateur créé
        res.status(201).json({ message: "Registration successful", user: result });
    } catch (error) {
        console.error("Error during registration:", error.stack);
        res.status(500).json({ message: "Internal server error", error: error.message });
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

        // Select the first project from the list, if it exists
        const projectId = existUser.projects && existUser.projects.length > 0 ? existUser.projects[0] : null;

        const payload = {
            userId: existUser._id,
            fullname: existUser.fullname,
            email: existUser.email,
            role: existUser.role,
            project_id: projectId
        };
        console.log("Payload:", JSON.stringify(payload));

        const token = jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: "1d" });

        // Create logs
        await createLog(existUser._id);
        console.log("Token:", token);

        // Ensure global.connectedUsers is always a Set
        if (!global.connectedUsers || !(global.connectedUsers instanceof Set)) {
            global.connectedUsers = new Set();
        }

        global.connectedUsers.add(existUser._id.toString());
        global.io.emit("userOnline", Array.from(global.connectedUsers));

        // Update firstlogin if true
        if (existUser.firstlogin === true) {
            await updateFirstLogin(existUser._id);
        }

        return res.status(200).json({ token: token, role: existUser.role, userId: existUser._id });
    } catch (error) {
        console.error('Error during login:', error.stack);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

const updateFirstLogin = async (userId) => {
    try {
        console.log(`Updating firstlogin for user: ${userId}`);
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new Error("Invalid userId");
        }

        const user = await userModel.findById(userId);
        if (!user) {
            throw new Error("User not found");
        }

        // Check if firstlogin field exists and is true
        if (typeof user.firstlogin === 'undefined') {
            console.warn(`firstlogin field is undefined for user: ${userId}`);
            return { success: false, message: "firstlogin field not defined" };
        }

        if (user.firstlogin === true) {
            user.firstlogin = false;
            await user.save();
            console.log(`firstlogin updated to false for user: ${userId}`);
            return { success: true, message: "firstlogin updated to false" };
        } else {
            console.log(`firstlogin is already false for user: ${userId}`);
            return { success: false, message: "firstlogin is already false" };
        }
    } catch (error) {
        console.error("Error updating firstlogin:", error.stack);
        throw new Error(`Failed to update firstlogin: ${error.message}`);
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
                    { path: 'businessManager', select: 'fullname email' },
                    { path: 'accountants', select: 'fullname email' },
                    { path: 'financialManagers', select: 'fullname email' },
                    { path: 'rhManagers', select: 'fullname email' },
                    { path: 'taxes' }, // Ajouter la population des taxes
                    { path: 'assets_actif' },
                    { path: 'objectifs' }
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
                manager: manager.project.businessManager,
                accountants: manager.project.accountants,
                financialManagers: manager.project.financialManagers,
                rhManagers: manager.project.rhManagers
            },
        
            taxes: manager.project.taxes,
            assets_actif: manager.project.assets_actif,
            objectifs: manager.project.objectifs 
        };

        res.status(200).json(projectData);
    } catch (error) {
        console.error("Error in findMyProject:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
}

async function findMyProject2(req, res) {
    try {
        // Retrieve the user ID and role from the token
        const userId = req.user.userId;
        const userRole = req.user.role;
        console.log(`User ID: ${userId}, Role: ${userRole}`);

        let projects = [];
        let user;

        // Fetch user based on role
        if (userRole === "BUSINESS_MANAGER") {
            // For BusinessManager: Fetch single project
            user = await userModel.findById(userId).populate({
                path: "project",
                populate: [
                    { path: "businessOwner", select: "fullname email" },
                    { path: "businessManager", select: "fullname email" },
                    { path: "accountants", select: "fullname email" },
                    { path: "financialManagers", select: "fullname email" },
                    { path: "rhManagers", select: "fullname email" },
                    { path: "taxes" },
                    { path: "assets_actif" },
                    { path: "objectifs" },
                ],
            });

            if (!user) {
                return res.status(404).json({ message: "BusinessManager not found" });
            }

            if (!user.project) {
                return res.status(404).json({ message: "No project assigned to this manager" });
            }

            projects = [user.project]; // Single project as array for uniform processing
        } else if (userRole === "BUSINESS_OWNER") {
            // For BusinessOwner: Fetch multiple projects
            user = await userModel.findById(userId).populate({
                path: "projects",
                populate: [
                    { path: "businessOwner", select: "fullname email" },
                    { path: "businessManager", select: "fullname email" },
                    { path: "accountants", select: "fullname email" },
                    { path: "financialManagers", select: "fullname email" },
                    { path: "rhManagers", select: "fullname email" },
                    { path: "taxes" },
                    { path: "assets_actif" },
                    { path: "objectifs" },
                ],
            });

            if (!user) {
                return res.status(404).json({ message: "BusinessOwner not found" });
            }

            if (!user.projects || user.projects.length === 0) {
                return res.status(404).json({ message: "No projects assigned to this owner" });
            }

            projects = user.projects; // Array of projects
        } else {
            return res.status(403).json({ message: "Unauthorized role, This block is accessible only for Owner" });
        }

        // Format the response
        const projectData = projects.map((project) => ({
            id: project._id,
            name: `Project ${project._id.toString().slice(-4)}`,
            description: `Managed by ${user.fullname}`,
            status: project.status,
            amount: project.amount,
            startDate: project.createdAt,
            endDate: project.due_date,
            businessOwner: project.businessOwner,
            teamMembers: {
                manager: project.businessManager,
                accountants: project.accountants,
                financialManagers: project.financialManagers,
                rhManagers: project.rhManagers,
            },
            taxes: project.taxes,
            assets_actif: project.assets_actif,
            objectifs: project.objectifs,
        }));

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

        // Créer une notification pour l'utilisateur
        const message = `Vous avez été affecté au projet ${projectId}`;
        await createNotification(result._id, message, projectId);
        
        // Émettre l'événement Socket.IO
        if (global.io) {
            global.io.to(result._id.toString()).emit("newNotification", {
                message,
                projectId,
                timestamp: new Date()
            });
        }

        // 🔟 Ajouter l'utilisateur au projet
        switch (req.body.role) { // Correction : "req symmetry.body.role" remplacé par "req.body.role"
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

        // Changement : Ajouter le nouvel utilisateur à la liste des participants de la conversation
        const conversation = await ProjectConversation.findOne({ projectId });
        if (conversation) {
            // Ajouter l'ID de l'utilisateur à la liste des participants (évite les doublons avec $addToSet)
            conversation.participants.addToSet(result._id);
            await conversation.save();
        } else {
            console.log(`Aucune conversation trouvée pour le projet ${projectId}.`);
        }

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
        const userId = req.params.id;

        // 1️⃣ Trouver l'utilisateur
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }

        // 2️⃣ Vérifier s'il a un projet
        if (user.project) {
            const project = await Project.findById(user.project);
            if (project) {
                // Retirer l'utilisateur du projet selon son rôle
                switch (user.role) {
                    case "ACCOUNTANT":
                        project.accountants = project.accountants.filter(id => id.toString() !== userId);
                        break;
                    case "FINANCIAL_MANAGER":
                        project.financialManagers = project.financialManagers.filter(id => id.toString() !== userId);
                        break;
                    case "RH":
                        project.rhManagers = project.rhManagers.filter(id => id.toString() !== userId);
                        break;
                    case "BUSINESS_OWNER":
                        if (project.businessOwner && project.businessOwner.toString() === userId) {
                            project.businessOwner = null;
                        }
                        break;
                    case "BUSINESS_MANAGER":
                        if (project.businessManager && project.businessManager.toString() === userId) {
                            project.businessManager = null;
                        }
                        break;
                }

                await project.save(); // Sauvegarder le projet après modification
            }
        }

        // 3️⃣ Supprimer l'utilisateur
        const deletedUser = await userModel.findByIdAndDelete(userId);

        res.send({ message: "User deleted successfully", data: deletedUser });

    } catch (err) {
        console.error("Error during user deletion:", err);
        res.status(500).send({ message: "Internal server error", error: err.message });
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

        // Vérifier si tous les champs sont présents et non vides
        if (!name || !email || !password || !role) {
            return res.status(400).json({ 
                message: 'Tous les champs sont obligatoires',
                fields: { name: !name, email: !email, password: !password, role: !role }
            });
        }

        // Validation du nom (minimum 2 caractères, maximum 50)
        if (name.length < 2 || name.length > 50) {
            return res.status(400).json({ 
                message: 'Le nom doit contenir entre 2 et 50 caractères'
            });
        }

        // Validation du format de l'email plus robuste
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                message: 'Format d\'email invalide',
                suggestion: 'Utilisez un email valide comme exemple@domaine.com'
            });
        }

        // Validation du mot de passe (minimum 8 caractères, au moins 1 majuscule, 1 minuscule, 1 chiffre)
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                message: 'Le mot de passe doit contenir au moins 8 caractères, dont une majuscule, une minuscule et un chiffre',
                requirements: {
                    minLength: 8,
                    uppercase: true,
                    lowercase: true,
                    number: true
                }
            });
        }

        // Validation des rôles autorisés
        const allowedRoles = ['employee', 'manager', 'admin'];
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ 
                message: 'Rôle non autorisé',
                allowedRoles: allowedRoles
            });
        }

        // Vérification du token
        if (!req.headers.authorization) {
            return res.status(401).json({ message: 'Token manquant' });
        }

        const token = req.headers.authorization.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: 'Format de token invalide. Utilisez: Bearer <token>' });
        }

        let decodedToken;
        try {
            decodedToken = jwt.verify(token, process.env.SECRET_KEY);
        } catch (jwtError) {
            return res.status(401).json({ 
                message: 'Token invalide ou expiré',
                error: jwtError.message 
            });
        }

        const userId = decodedToken.userId;
        if (!userId) {
            return res.status(400).json({ message: "ID utilisateur manquant dans le token" });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        // Vérification du type d'utilisateur
        if (user.userType !== "RH") {
            return res.status(403).json({ 
                message: "Seuls les utilisateurs de type RH peuvent ajouter des employés",
                userType: user.userType
            });
        }

        const projectId = user.project;
        if (!projectId) {
            return res.status(400).json({ 
                message: "Aucun projet associé à l'utilisateur connecté",
                solution: "Assurez-vous que l'utilisateur RH est bien affecté à un projet"
            });
        }

        // Vérifier si un employé avec cet email existe déjà (case insensitive)
        const existingEmployee = await Employe.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
        if (existingEmployee) {
            return res.status(409).json({ 
                message: 'Un employé avec cet email existe déjà',
                existingEmployeeId: existingEmployee._id
            });
        }

        // Hachage du mot de passe
        const hashedPassword = await bcryptjs.hash(password, 10);

        // Créer le nouvel employé
        const newEmployee = new Employe({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            role,
            project: projectId
        });

        // Sauvegarder l'employé dans la base de données
        await newEmployee.save();

        // Mettre à jour le projet avec le nouvel employé
        await Project.findByIdAndUpdate(projectId, {
            $push: { employees: newEmployee._id }
        }, { new: true });

        // Ne pas renvoyer le mot de passe dans la réponse
        const employeeResponse = newEmployee.toObject();
        delete employeeResponse.password;

        return res.status(201).json({ 
            message: 'Employé ajouté avec succès', 
            employee: employeeResponse,
            projectId: projectId
        });

    } catch (error) {
        console.error("Erreur lors de l'ajout de l'employé:", error);
        
        // Gestion spécifique des erreurs de base de données
        if (error.name === 'MongoError' && error.code === 11000) {
            return res.status(409).json({ 
                message: 'Email déjà utilisé (erreur de base de données)',
                error: error.message
            });
        }
        
        // Erreur de validation Mongoose
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: 'Erreur de validation des données',
                errors: Object.values(error.errors).map(err => err.message)
            });
        }

        return res.status(500).json({ 
            message: 'Erreur interne du serveur',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
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

        // Sauvegarder le mot de passe en clair pour l'email avant de le hacher
        const plainPassword = req.body.password;

        // 4️⃣ Hachage du mot de passe
        const hashedPassword = await bcryptjs.hash(plainPassword, 10);

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
                      <p style="color: #555;"><strong>Password:</strong> ${plainPassword}</p>
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
const getAvailableAndAssignedBusinessManagers = async (req, res) => {
    try {
        const userId = req.user.userId;
        const businessOwnerId = req.user._id;
        const user = await userModel.findById(userId).populate('projects');

        // récupérer les projets du businessOwner connecté
        const projects = user.projects;
        console.log(projects);

        // extraire les IDs des BusinessManagers affectés à ces projets
        const assignedBMIds = projects
            .filter(p => p.businessManager) // éviter les null
            .map(p => p.businessManager.toString());

        // récupérer tous les BusinessManagers
        const allBusinessManagers = await userModel.find({ userType: "BusinessManager" });

        // filtrer ceux affectés aux projets du BusinessOwner
        const assignedBusinessManagers = allBusinessManagers.filter(bm =>
            assignedBMIds.includes(bm._id.toString())
        );

        // filtrer ceux qui n'ont aucun projet
        const unassignedBusinessManagers = allBusinessManagers.filter(bm =>
            !bm.project // champ vide ou non défini
        );
        const businessManagers = [
            ...assignedBusinessManagers.map(bm => ({ ...bm.toObject(), status: 'assigned' })),
            ...unassignedBusinessManagers.map(bm => ({ ...bm.toObject(), status: 'unassigned' }))
        ];

        res.status(200).json({ businessManagers });

    } catch (error) {
        console.error("Error retrieving Business Managers:", error);
        res.status(500).json({ message: "Server error" });
    }
};
const fetchProjectByUser = async (req, res) => {
    try {
      const { userId } = req.params;
  
      // Validate userId
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid userId" });
      }
      const objectId = new mongoose.Types.ObjectId(userId);
      console.log("User ID:", objectId);
  
      // Fetch user with role, wallet_id, and project
      const user = await userModel.findById(objectId).select("role wallet_id project");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      console.log("User retrieved:", {
        _id: user._id,
        role: user.role,
        wallet_id: user.wallet_id,
        project: user.project,
      });
  
      // Handle based on role
      if (user.role !== "z") {
        // Non-BusinessOwner (e.g., BusinessManager, Accountant, RH, FinancialManager)
        if (!user.wallet_id) {
          return res.status(404).json({ message: "No wallet associated with this user" });
        }
        console.log("Wallet ID:", user.wallet_id);
  
        const wallet = await Wallet.findById(user.wallet_id).select("project");
        if (!wallet) {
          return res.status(404).json({ message: "Wallet not found" });
        }
        console.log("Wallet retrieved:", wallet);
  
        if (!wallet.project) {
          return res.status(404).json({ message: "No project associated with this wallet" });
        }
        console.log("Project ID:", wallet.project);
  
        const project = await Project.findById(wallet.project)
          .populate("businessManager", "fullname email")
          .populate("accountants", "fullname email")
          .populate("financialManagers", "fullname email")
          .populate("businessOwner", "fullname email")
          .populate("rhManagers", "fullname email")
          .populate("taxes")
          .populate("assets_actif")
          .exec();
  
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }
        console.log("Project retrieved:", project);
  
        return res.status(200).json(project);
      } else {
        // BusinessOwner (role: "z")
        if (!user.project) {
          return res.status(404).json({ message: "No project associated with this BusinessOwner" });
        }
        console.log("Project ID:", user.project);
  
        const project = await Project.findById(user.project)
          .populate("businessManager", "fullname email")
          .populate("accountants", "fullname email")
          .populate("financialManagers", "fullname email")
          .populate("businessOwner", "fullname email")
          .populate("rhManagers", "fullname email")
          .populate("taxes")
          .populate("assets_actif")
          .exec();
  
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }
        console.log("Project retrieved:", project);
  
        return res.status(200).json(project);
      }
    } catch (error) {
      console.error("Error fetching project by user:", error.stack);
      res.status(500).json({
        message: "Failed to fetch project for user",
        error: error.message,
      });
    }
  };


module.exports = {
    Register, Login, getAll,getAvailableAndAssignedBusinessManagers,
    findMyProfile, deleteprofilbyid, deletemyprofile,
    acceptAutorisation, updateProfile, AddPicture, getBusinessOwnerFromToken,
    getAllBusinessManagers, getAllAccountants, getAllFinancialManagers, getAllRH, findMyProject, Registerwithproject,
    resetPassword, forgotPassword, verifyCode, sendVerificationCode, getAllempl, addEmployeesFromExcel, getAllBusinessOwners, addEmployee, downloadEvidence, RegisterManger,           // New
     getAllRoles, findMyPicture, logout, getbyid, deleteById, updateById, findMyProjectsOwner, updateFirstLogin,findMyProject2,fetchProjectByUser   // New
   
};