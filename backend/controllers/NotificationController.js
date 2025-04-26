const mongoose = require('mongoose');

const Notification = require('../model/Notification');

// Créer une nouvelle notification
// Créer une nouvelle notification et émettre un événement Socket.IO
const createNotification = async (userId, message, projectId) => {
    try {
        const notification = new Notification({
            userId,
            message,
            projectId
        });
        await notification.save();

        // Émettre la notification via Socket.IO pour une mise à jour en temps réel
        if (global.io) {
            global.io.to(userId.toString()).emit('newNotification', notification);
            console.log(`✅ Nouvelle notification émise via Socket.IO pour l'utilisateur ${userId}:`, notification);
        }

        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};

// Récupérer les notifications d'un utilisateur
const getUserNotifications = async (req, res) => {
    try {
        const userId = req.user.userId;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid userId" });
        }

        const notifications = await Notification.find({ userId: new mongoose.Types.ObjectId(userId) })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('projectId', 'name') // Optionnel : Peupler projectId pour inclure le nom du projet
            .populate('userId', 'fullname'); // Optionnel : Peupler userId pour inclure le nom de l'utilisateur

        // Envoyer les notifications via Socket.IO (temps réel)
        if (global.io) {
            global.io.to(userId.toString()).emit('userNotifications', notifications);
            console.log(`✅ Notifications envoyées en temps réel à l'utilisateur ${userId}`);
        }

        // Renvoyer les notifications dans la réponse HTTP
        res.status(200).json({
            message: "Notifications récupérées avec succès",
            notifications: notifications
        });

    } catch (error) {
        console.error('Error getting notifications:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
// Marquer une notification comme lue
const markNotificationAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user.userId;

        if (!mongoose.Types.ObjectId.isValid(notificationId)) {
            return res.status(400).json({ message: "Invalid notificationId" });
        }

        const notification = await Notification.findOne({
            _id: new mongoose.Types.ObjectId(notificationId),
            userId: new mongoose.Types.ObjectId(userId)
        });

        if (!notification) {
            return res.status(404).json({ message: "Notification not found or you do not have permission to modify it" });
        }

        notification.isRead = true;
        await notification.save();

        // Optionnel : Émettre un événement Socket.IO pour informer les clients connectés
        if (global.io) {
            global.io.to(userId.toString()).emit('notificationUpdated', notification);
            console.log(`✅ Notification marquée comme lue et émise via Socket.IO pour l'utilisateur ${userId}`);
        }

        res.status(200).json({
            message: "Notification marked as read",
            notification
        });

    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    createNotification,
    getUserNotifications,
    markNotificationAsRead
}; 