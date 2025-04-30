import { io } from 'socket.io-client';

class NotificationService {
  constructor() {
    this.socket = null;
    this.notificationHandlers = new Map();
  }

  initializeSocket(token) {
    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io('http://localhost:5000', {
      auth: {
        token: token
      }
    });

    this.setupSocketListeners();
  }

  setupSocketListeners() {
    if (!this.socket) return;

    // Listen for salary notifications
    this.socket.on('salaryAdded', (data) => {
      this.handleNotification('salaryAdded', data);
    });

    // Listen for objective status change notifications
    this.socket.on('objectiveStatusChanged', (data) => {
      this.handleNotification('objectiveStatusChanged', data);
    });

    // Handle connection events
    this.socket.on('connect', () => {
      console.log('Connected to notification server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from notification server');
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  on(event, handler) {
    if (!this.notificationHandlers.has(event)) {
      this.notificationHandlers.set(event, new Set());
    }
    this.notificationHandlers.get(event).add(handler);
  }

  off(event, handler) {
    if (this.notificationHandlers.has(event)) {
      this.notificationHandlers.get(event).delete(handler);
    }
  }

  handleNotification(event, data) {
    if (this.notificationHandlers.has(event)) {
      this.notificationHandlers.get(event).forEach(handler => {
        handler(data);
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

// Create a singleton instance
const notificationService = new NotificationService();
export default notificationService; 