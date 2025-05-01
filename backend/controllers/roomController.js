const Room = require('../model/Room');
const Project = require('../model/Project');
const JoinAttempt = require('../model/JoinAttempt');
const { v4: uuidv4 } = require('uuid');

// Créer une nouvelle salle de réunion
exports.createRoom = async (req, res) => {
  try {
    const { projectId, title, date } = req.body;
    const userId = req.user.userId;

    console.log('Creating room with:', { projectId, title, date, userId });

    // Vérifier si la date est dans le futur
    const now = new Date();
    if (new Date(date) <= now) {
      console.log('Invalid date: Date must be in the future');
      return res.status(400).json({ message: 'La date de la réunion doit être dans le futur.' });
    }

    // Vérifier si l'utilisateur a accès au projet
    const project = await Project.findById(projectId);
    if (!project) {
      console.log('Project not found:', projectId);
      return res.status(404).json({ message: 'Project not found' });
    }

    console.log('Project found:', {
      id: project._id,
      businessManager: project.businessManager,
      accountants: project.accountants,
      financialManagers: project.financialManagers,
      rhManagers: project.rhManagers,
      businessOwner: project.businessOwner
    });

    // Vérifier si l'utilisateur est membre du projet
    const isMember = 
      project.businessManager?.equals(userId) ||
      project.accountants?.some(acc => acc.equals(userId)) ||
      project.financialManagers?.some(fm => fm.equals(userId)) ||
      project.rhManagers?.some(rh => rh.equals(userId)) ||
      project.businessOwner?.equals(userId);

    console.log('User membership check:', {
      userId,
      isMember,
      businessManagerMatch: project.businessManager?.equals(userId),
      accountantMatch: project.accountants?.some(acc => acc.equals(userId)),
      financialManagerMatch: project.financialManagers?.some(fm => fm.equals(userId)),
      rhManagerMatch: project.rhManagers?.some(rh => rh.equals(userId)),
      businessOwnerMatch: project.businessOwner?.equals(userId)
    });

    if (!isMember) {
      console.log('User is not a member of the project');
      return res.status(403).json({ message: 'You are not a member of this project' });
    }

    // Créer une nouvelle salle
    const room = new Room({
      projectId,
      roomId: uuidv4(),
      title,
      date,
      participants: [{
        userId,
        joinedAt: new Date()
      }]
    });

    await room.save();
    console.log('Room created successfully:', room.roomId);

    res.status(201).json({
      roomId: room.roomId,
      message: 'Room created successfully'
    });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ message: 'Error creating room' });
  }
};

// Rejoindre une salle de réunion
exports.joinRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.userId;

    const room = await Room.findOne({ roomId });
    if (!room) {
      await new JoinAttempt({
        userId,
        roomId,
        success: false,
        reason: 'Room not found'
      }).save();
      return res.status(404).json({ message: 'Room not found' });
    }

    // Vérifier si la réunion n'a pas encore commencé (avec 5 minutes de tolérance)
    const now = new Date();
    const bufferTime = 5 * 60 * 1000; // 5 minutes
    if (room.date && new Date(room.date) > new Date(now.getTime() + bufferTime)) {
      await new JoinAttempt({
        userId,
        roomId,
        success: false,
        reason: 'Meeting has not started'
      }).save();
      return res.status(400).json({
        message: `La réunion n'a pas encore commencé. Veuillez attendre le ${new Date(room.date).toLocaleString('fr-FR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}.`
      });
    }

    // Vérifier si l'utilisateur est déjà dans la salle
    const existingParticipant = room.participants.find(p => p.userId.equals(userId));
    if (existingParticipant) {
      await new JoinAttempt({
        userId,
        roomId,
        success: false,
        reason: 'Already in room'
      }).save();
      return res.status(200).json({ message: 'Already in room' });
    }

    // Vérifier si l'utilisateur a accès au projet
    const project = await Project.findById(room.projectId);
    if (!project) {
      await new JoinAttempt({
        userId,
        roomId,
        success: false,
        reason: 'Project not found'
      }).save();
      return res.status(404).json({ message: 'Project not found' });
    }

    const isMember =
      project.businessManager?.equals(userId) ||
      project.accountants?.some(acc => acc.equals(userId)) ||
      project.financialManagers?.some(fm => fm.equals(userId)) ||
      project.rhManagers?.some(rh => rh.equals(userId)) ||
      project.businessOwner?.equals(userId);

    if (!isMember) {
      await new JoinAttempt({
        userId,
        roomId,
        success: false,
        reason: 'Not a member of the project'
      }).save();
      return res.status(403).json({ message: 'You are not a member of this project' });
    }

    // Ajouter l'utilisateur à la salle
    room.participants.push({
      userId,
      joinedAt: new Date()
    });

    await room.save();

    await new JoinAttempt({
      userId,
      roomId,
      success: true
    }).save();

    res.status(200).json({ message: 'Joined room successfully' });
  } catch (error) {
    console.error('Error joining room:', error);
    await new JoinAttempt({
      userId,
      roomId,
      success: false,
      reason: 'Server error'
    }).save();
    res.status(500).json({ message: 'Error joining room' });
  }
};

// Quitter une salle de réunion
exports.leaveRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.userId;

    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Vérifier si l'utilisateur est un participant actif
    const participant = room.participants.find(p => p.userId.equals(userId) && !p.leftAt);
    if (!participant) {
      return res.status(400).json({ message: 'Vous n\'êtes pas un participant actif de cette réunion.' });
    }

    // Marquer l'utilisateur comme ayant quitté
    participant.leftAt = new Date();

    // Si c'est le dernier participant actif, fermer la salle
    const activeParticipants = room.participants.filter(p => !p.leftAt);
    if (activeParticipants.length === 0) {
      room.status = 'ended';
      room.endedAt = new Date();
    }

    await room.save();

    res.status(200).json({ message: 'Left room successfully' });
  } catch (error) {
    console.error('Error leaving room:', error);
    res.status(500).json({ message: 'Error leaving room' });
  }
};

// Supprimer une salle de réunion
exports.deleteRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Vérifier si l'utilisateur a le droit de supprimer (par exemple, BUSINESS_MANAGER)
    if (userRole !== 'BUSINESS_MANAGER') {
      return res.status(403).json({ message: 'You are not authorized to delete this room' });
    }

    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Vérifier si l'utilisateur est membre du projet associé
    const project = await Project.findById(room.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isMember =
      project.businessManager?.equals(userId) ||
      project.accountants?.some(acc => acc.equals(userId)) ||
      project.financialManagers?.some(fm => fm.equals(userId)) ||
      project.rhManagers?.some(rh => rh.equals(userId)) ||
      project.businessOwner?.equals(userId);

    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this project' });
    }

    // Supprimer la réunion
    await Room.deleteOne({ roomId });

    res.status(200).json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({ message: 'Error deleting room' });
  }
};

// Obtenir les informations d'une salle
exports.getRoomInfo = async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findOne({ roomId })
      .populate('participants.userId', 'fullname email')
      .populate('projectId', 'name');

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.status(200).json(room);
  } catch (error) {
    console.error('Error getting room info:', error);
    res.status(500).json({ message: 'Error getting room info' });
  }
};

// Lister toutes les réunions d'un projet
exports.getRoomsByProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const rooms = await Room.find({ projectId })
      .populate('participants.userId', 'fullname email')
      .populate('projectId', 'name');

    res.status(200).json(rooms);
  } catch (error) {
    console.error('Error getting rooms by project:', error);
    res.status(500).json({ message: 'Error getting rooms by project' });
  }
};