var createError = require('http-errors');
var express = require('express');
const http = require("http");
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors');
const { Server } = require("socket.io");

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var assetsactifsRoutes = require('./routes/assetActifRoutes');
var assetspassifsRoutes = require('./routes/assetPassifRoutes');
var assetCalculationRoutes = require('./routes/AssetRoutes');
var projectRouter = require('./routes/project.router');
var taxeRoutes = require('./routes/taxeRoutes');
var transactionRoutes = require('./routes/transactionRoutes');
var walletRoutes = require('./routes/walletRoutes');
var chatRouter = require('./routes/chatRoutes');

var app = express();
var mongoose = require("mongoose");
var connection = require("./config/database.json");

// Connexion à MongoDB
mongoose.connect(connection.url)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ Error connecting to MongoDB:", err));

// Active CORS pour le frontend React et Jade
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Configuration du moteur de vue
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Définition des routes
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/project', projectRouter);
app.use('/assetsactifs', assetsactifsRoutes);
app.use('/assetspassifs', assetspassifsRoutes);
app.use('/assetCalculation', assetCalculationRoutes);
app.use('/taxes', taxeRoutes);
app.use('/wallets', walletRoutes);
app.use('/transactions', transactionRoutes);
app.use('/chat', chatRouter);

// Test API
app.get('/api/test', (req, res) => {
  res.status(200).json({ message: 'Project tested' });
});

// Socket.IO pour le chat en temps réel
const server = http.createServer(app);

global.io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5000"],
    methods: ["GET", "POST"],
  },
});

const Chat = require('./model/Chat');
const userModel = require('./model/user');

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("joinChat", (chatId) => {
    socket.join(chatId);
    console.log(`User ${socket.id} joined chat: ${chatId}`);
  });

  socket.on("sendMessage", async ({ chatId, content, senderId }) => {
    try {
      const chat = await Chat.findById(chatId);
      if (!chat) {
        socket.emit("error", { message: "Chat non trouvé" });
        return;
      }

      if (!chat.participants.includes(senderId)) {
        socket.emit("error", { message: "Vous n'êtes pas autorisé dans ce chat" });
        return;
      }

      const message = {
        sender: senderId,
        content,
        timestamp: new Date()
      };

      chat.messages.push(message);
      await chat.save();

      io.to(chatId).emit("newMessage", message);
      console.log(`Message sent in chat ${chatId}: ${content} by ${senderId}`);

      const otherParticipant = chat.participants.find(
        (participant) => participant.toString() !== senderId
      );

      if (otherParticipant) {
        const sender = await userModel.findById(senderId, "fullname");
        const senderName = sender ? sender.fullname : senderId;
        io.to(chatId).emit("newNotification", {
          chatId,
          senderId,
          recipientId: otherParticipant,
          message: `${senderName} vous a envoyé un message: "${content}"`,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error);
      socket.emit("error", { message: "Erreur serveur" });
    }
  });

  // Nouvel événement pour indiquer qu'un utilisateur est en train d'écrire
  socket.on("typing", async ({ chatId, senderId }) => {
    try {
      const chat = await Chat.findById(chatId);
      if (!chat || !chat.participants.includes(senderId)) return;

      const otherParticipant = chat.participants.find(
        (participant) => participant.toString() !== senderId
      );

      if (otherParticipant) {
        const sender = await userModel.findById(senderId, "fullname");
        const senderName = sender ? sender.fullname : senderId;
        io.to(chatId).emit("userTyping", {
          chatId,
          senderId,
          senderName,
          recipientId: otherParticipant
        });
      }
    } catch (error) {
      console.error("Erreur lors de la gestion de typing:", error);
    }
  });

  // Événement pour arrêter l'indicateur d'écriture
  socket.on("stopTyping", ({ chatId, senderId }) => {
    io.to(chatId).emit("userStoppedTyping", { chatId, senderId });
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Gestion des erreurs 404
app.use((req, res, next) => {
  next(createError(404));
});

// Gestion globale des erreurs
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;