const ProjectConversation = require('../model/ProjectConversation');
const User = require('../model/user');

// Créer une nouvelle conversation pour un projet
exports.createConversation = async (req, res) => {
  try {
    const { projectId, participants } = req.body;
    
    const conversation = new ProjectConversation({
      projectId,
      participants,
      messages: []
    });

    await conversation.save();
    res.status(201).json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtenir les messages d'une conversation de projet
exports.getConversationMessages = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const conversation = await ProjectConversation.findOne({ projectId })
      .populate('messages.sender', 'fullname')
      .populate('participants', 'fullname');

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation non trouvée' });
    }

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Envoyer un message dans une conversation de projet
exports.sendMessage = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { senderId, content } = req.body;

    const conversation = await ProjectConversation.findOne({ projectId });
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation non trouvée' });
    }

    const message = {
      sender: senderId,
      content,
      timestamp: new Date()
    };

    conversation.messages.push(message);
    await conversation.save();

    // Émettre l'événement Socket.IO
    global.io.to(projectId).emit('newProjectMessage', {
      projectId,
      message: {
        ...message,
        sender: await User.findById(senderId, 'fullname')
      }
    });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 