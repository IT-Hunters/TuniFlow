var createError = require('http-errors');
var express = require('express');
const http = require("http");
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors');
const { Server } = require("socket.io");
const logs = require('./middleware/Logger');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var invoiceRouter = require('./routes/invoiceRoutes');
var ObjectifRouter = require('./routes/ObjectifRoutes');
var assetsactifsRoutes = require('./routes/assetActifRoutes');
var assetspassifsRoutes = require('./routes/assetPassifRoutes');
var assetCalculationRoutes = require('./routes/AssetRoutes');
var projectRouter = require('./routes/project.router');
var taxeRoutes = require('./routes/taxeRoutes');
var transactionRoutes = require('./routes/transactionRoutes');
var walletRoutes = require('./routes/walletRoutes');
var chatRouter = require('./routes/chatRoutes');
var userLogsRoutes = require('./routes/UserLogsRoutes');
var logsRoutes = require('./routes/logsRoutes');
const serverless = require('serverless-http'); // Added for Netlify Functions

var app = express();
var mongoose = require("mongoose");
var connection = require("./config/database.json");

// 🟢 MongoDB Connection
mongoose.connect(connection.url)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ Error connecting to MongoDB:", err));

// 🟢 Enable CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5000', "*"],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control'], 
}));

// 🟢 View Engine Setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logs);
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// 🟢 Define Routes
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/project', projectRouter);
app.use('/invoices', invoiceRouter); 
app.use('/assetsactifs', assetsactifsRoutes);
app.use('/assetspassifs', assetspassifsRoutes);
app.use('/assetCalculation', assetCalculationRoutes);
app.use('/taxes', taxeRoutes);
app.use('/wallets', walletRoutes);
app.use('/transactions', transactionRoutes);
app.use('/logs', logsRoutes);
app.use('/objectif', ObjectifRouter);
app.use('/chat', chatRouter);
app.use('/userLogs', userLogsRoutes);

// 🟢 Test API
app.get('/api/test', (req, res) => {
  res.status(200).json({ message: 'Project tested' });
});

// 🟢 WebSocket Server Setup
const server = http.createServer(app);

global.io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5000", "*"],
    methods: ["GET", "POST"],
  },
});

// 🟢 Import Models
const Chat = require('./model/Chat');
const userModel = require('./model/user');

// 🟢 Global Connected Users Set
global.connectedUsers = new Set();

// 🟢 Socket.IO Events
global.io.on("connection", (socket) => {
  console.log(`🟢 Socket connected: ${socket.id}`);

  // When a user logs in, the client emits "userOnline" with the user ID.
  socket.on("userOnline", (userId) => {
    socket.userId = userId;
    global.connectedUsers.add(userId);
    console.log('✅ Connected Users:', Array.from(global.connectedUsers));
    global.io.emit("userOnline", Array.from(global.connectedUsers));
  });

  // When a user explicitly logs out, the client can emit "userOffline"
  socket.on("userOffline", (userId) => {
    global.connectedUsers.delete(userId);
    console.log('❌ Updated Connected Users:', Array.from(global.connectedUsers));
    global.io.emit("userOnline", Array.from(global.connectedUsers));
  });

  // 🔹 Join Chat Room
  socket.on("joinChat", (chatId) => {
    socket.join(chatId);
    console.log(`User ${socket.id} joined chat: ${chatId}`);
  });

  // 🔹 Handle Sending Messages
  socket.on("sendMessage", async ({ chatId, content, senderId }) => {
    try {
      const chat = await Chat.findById(chatId);
      if (!chat || !chat.participants.includes(senderId)) return;

      const message = { sender: senderId, content, timestamp: new Date() };
      chat.messages.push(message);
      await chat.save();

      global.io.to(chatId).emit("newMessage", message);

      // Notify recipient
      const otherParticipant = chat.participants.find(p => p.toString() !== senderId);
      if (otherParticipant) {
        const sender = await userModel.findById(senderId, "fullname");
        const senderName = sender ? sender.fullname : senderId;
        global.io.to(chatId).emit("newNotification", {
          chatId,
          senderId,
          recipientId: otherParticipant,
          message: `${senderName} vous a envoyé un message: "${content}"`,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error("❌ Error sending message:", error);
    }
  });

  // 🔹 Typing Indicator
  socket.on("typing", async ({ chatId, senderId }) => {
    const chatರ

    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(senderId)) return;

    const otherParticipant = chat.participants.find(p => p.toString() !== senderId);
    if (otherParticipant) {
      const sender = await userModel.findById(senderId, "fullname");
      const senderName = sender ? sender.fullname : senderId;
      global.io.to(chatId).emit("userTyping", { chatId, senderId, senderName, recipientId: otherParticipant });
    }
  });

  socket.on("stopTyping", ({ chatId, senderId }) => {
    global.io.to(chatId).emit("userStoppedTyping", { chatId, senderId });
  });

  // 🔹 Handle Disconnection
  socket.on("disconnect", () => {
    console.log(`🔴 Socket disconnected: ${socket.id}`);
    if (socket.userId) {
      global.connectedUsers.delete(socket.userId);
      console.log(`❌ User ${socket.userId} removed. Connected Users:`, Array.from(global.connectedUsers));
      global.io.emit("userOnline", Array.from(global.connectedUsers));
    }
  });
});

// 🟢 Start Server (Not needed for Netlify Functions, but kept for local testing)
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// 🟢 Error Handling
app.use((req, res, next) => {
  next(createError(404));
});

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

// Export for Netlify Functions
module.exports.handler = serverless(app);