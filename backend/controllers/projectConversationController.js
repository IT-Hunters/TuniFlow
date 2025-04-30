const ProjectConversation = require('../model/ProjectConversation');
const User = require('../model/user');
const Project = require('../model/Project');
const sanitizeHtml = require('sanitize-html');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Créer une nouvelle conversation pour un projet
exports.createConversation = async (req, res) => {
  try {
    const { projectId, participants } = req.body;

    // Vérification du projet
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Projet non trouvé' });
    }

    // Vérification des participants
    const validParticipants = await User.find({ _id: { $in: participants } });
    if (validParticipants.length !== participants.length) {
      return res.status(400).json({ message: 'Certains participants sont invalides' });
    }

    // Nouvelle validation des rôles (incluant BUSINESS_MANAGER)
    const validRoles = ['ACCOUNTANT', 'FINANCIAL_MANAGER', 'RH', 'BUSINESS_MANAGER'];
    const invalidParticipants = validParticipants.filter(
      user => !validRoles.includes(user.role)
    );

    if (invalidParticipants.length > 0) {
      console.error('Participants invalides:', invalidParticipants);
      return res.status(400).json({ 
        message: 'Certains utilisateurs ont des rôles non autorisés'
      });
    }

    // Création de la conversation
    const conversation = new ProjectConversation({
      projectId,
      participants,
      messages: []
    });

    await conversation.save();
    res.status(201).json(conversation);

  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ 
      message: 'Erreur serveur',
      error: error.message 
    });
  }
};

// Obtenir les messages d'une conversation de projet (avec pagination)
exports.getConversationMessages = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { page = 1, limit = 20 } = req.query; // Par défaut, 20 messages par page

    // Vérifier que projectId est valide
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: 'projectId invalide' });
    }

    // Vérifier la connexion à la base de données
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Base de données non disponible' });
    }

    // Trouver la conversation
    const conversation = await ProjectConversation.findOne({ projectId })
      .populate('messages.sender', 'fullname email')
      .populate('participants', 'fullname email')
      .select('projectId messages participants');

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation non trouvée' });
    }

    // Pagination des messages
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedMessages = conversation.messages.slice(startIndex, endIndex);

    // Réponse avec pagination
    res.json({
      projectId: conversation.projectId,
      participants: conversation.participants,
      messages: paginatedMessages,
      totalMessages: conversation.messages.length,
      currentPage: parseInt(page),
      totalPages: Math.ceil(conversation.messages.length / limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Envoyer un message dans une conversation de projet
exports.sendMessage = async (req, res) => {
  const { projectId } = req.params;
  const { content } = req.body; // senderId est maintenant extrait du token

  // 1. Vérification de l'authentification
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'Token manquant' });
  }

  try {
    // 2. Vérification du token et récupération de l'utilisateur
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const user = await User.findById(decoded.userId).select('_id fullname email');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    // 3. Vérification de la conversation
    const conversation = await ProjectConversation.findOne({
      projectId,
      participants: { $in: [user._id] }
    });
    if (!conversation) {
      return res.status(403).json({ 
        success: false, 
        message: 'Conversation non trouvée ou accès non autorisé' 
      });
    }

    // 4. Validation du message
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Le contenu du message est invalide' 
      });
    }

    // 5. Création et sauvegarde du message
    const newMessage = {
      sender: user._id,
      content: sanitizeHtml(content.trim()), // Nettoyage XSS
      timestamp: new Date()
    };

    conversation.messages.push(newMessage);
    await conversation.save();

    // 6. Préparation de l'objet message pour Socket.IO
    const messageToEmit = {
      _id: conversation.messages[conversation.messages.length - 1]._id,
      content: newMessage.content,
      sender: {
        _id: user._id,
        fullname: user.fullname,
        email: user.email
      },
      timestamp: newMessage.timestamp
    };

    // 7. Diffusion en temps réel
    if (global.io) {
      console.log(`[Socket] Émission vers project:${projectId}`);
      global.io.to(projectId.toString()).emit('newProjectMessage', {
        projectId: projectId.toString(),
        message: messageToEmit
      });
    } else {
      console.error('Socket.IO non disponible');
    }

    // 8. Réponse API
    return res.status(201).json({
      success: true,
      message: 'Message envoyé avec succès',
      newMessage: messageToEmit
    });

  } catch (error) {
    console.error('Erreur sendMessage:', error);

    // Gestion spécifique des erreurs JWT
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token invalide' 
      });
    }

    // Erreur serveur générique
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Middleware pour vérifier si l'utilisateur est un participant
exports.verifyParticipant = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id; // Supposons que l'ID de l'utilisateur est disponible via un middleware d'authentification

    // Vérifier que projectId est valide
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: 'projectId invalide' });
    }

    // Trouver la conversation
    const conversation = await ProjectConversation.findOne({ projectId });
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation non trouvée' });
    }

    // Vérifier que l'utilisateur est un participant
    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
