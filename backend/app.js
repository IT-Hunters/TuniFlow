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
var invoiceRouter = require('./routes/invoiceRoutes');
var ObjectifRouter = require('./routes/ObjectifRoutes');
var assetsactifsRoutes = require('./routes/assetActifRoutes');
var assetspassifsRoutes = require('./routes/assetPassifRoutes');
var assetCalculationRoutes = require('./routes/AssetRoutes');
var projectRouter = require('./routes/project.router');
var projectConversationRouter = require('./routes/projectConversationRoutes');
var taxeRoutes = require('./routes/taxeRoutes');
var transactionRoutes = require('./routes/transactionRoutes');
const logs = require('./middleware/Logger');
var walletRoutes = require('./routes/walletRoutes');
var chatRouter = require('./routes/chatRoutes');
var userLogsRoutes = require('./routes/UserLogsRoutes');
const salarySchedulerRoutes = require('./routes/salarySchedulerRoutes');
var logsRoutes = require('./routes/logsRoutes');
require('./jobs/salaryProcessor');
const financialStatementRoutes = require("./routes/financialStatementRoutes");
const roomRoutes = require('./routes/roomRoutes');
const calendarRoutes = require('./routes/calendarRoutes');
var app = express();
var mongoose = require("mongoose");
var connection = require("./config/database.json");

// 🟢 MongoDB Connection
mongoose.connect(connection.url)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ Error connecting to MongoDB:", err));

// 🟢 Enable CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'X-Requested-With', 'Access-Control-Allow-Origin', 'Access-Control-Allow-Headers'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// 🟢 View Engine Setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(logs);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// 🟢 Define Routes
//app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/logs',logsRoutes);
app.use('/project', projectRouter);
app.use('/project-conversations', projectConversationRouter);
app.use('/invoices', invoiceRouter);
app.use('/assetsactifs', assetsactifsRoutes);
app.use('/assetspassifs', assetspassifsRoutes);
app.use('/assetCalculation', assetCalculationRoutes);
app.use('/taxes', taxeRoutes);
app.use('/wallets', walletRoutes);
app.use('/transactions', transactionRoutes);
app.use('/objectif', ObjectifRouter);
app.use('/chat', chatRouter);
app.use('/userLogs', userLogsRoutes);
app.use('/salary-scheduler', salarySchedulerRoutes);
app.use("/financial_statements", financialStatementRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/', calendarRoutes);
// 🟢 Test API
app.get('/api/test', (req, res) => {
  res.status(200).json({ message: 'Project tested' });
});

// 🟢 WebSocket Server Setup
const server = http.createServer(app);

global.io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5000"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cache-Control", "X-Requested-With", "Access-Control-Allow-Origin", "Access-Control-Allow-Headers"],
    credentials: true,
    transports: ['websocket', 'polling']
  },
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
});

// 🟢 Import Models
const Chat = require('./model/Chat');
const userModel = require('./model/user');
const { startNotificationJob } = require('./jobs/notificationJob');

// 🟢 Global Connected Users Set
if (!global.connectedUsers || !(global.connectedUsers instanceof Set)) {
  global.connectedUsers = new Set();
  console.log("✅ Initialized global.connectedUsers as a Set");
}

// 🟢 Socket.IO Events
global.io.on("connection", (socket) => {
  console.log(`🟢 Socket connected: ${socket.id}`);

  socket.on("userOnline", (userId) => {
    socket.userId = userId;
    if (global.connectedUsers instanceof Set) {
      global.connectedUsers.add(userId);
      console.log('✅ Connected Users:', Array.from(global.connectedUsers));
      global.io.emit("userOnline", Array.from(global.connectedUsers));
    } else {
      console.error("❌ global.connectedUsers is not a Set:", global.connectedUsers);
    }
  });

  socket.on("userOffline", (userId) => {
    if (global.connectedUsers instanceof Set) {
      global.connectedUsers.delete(userId);
      console.log('❌ Updated Connected Users:', Array.from(global.connectedUsers));
      global.io.emit("userOnline", Array.from(global.connectedUsers));
    } else {
      console.error("❌ global.connectedUsers is not a Set:", global.connectedUsers);
    }
  });

  socket.on("joinChat", (chatId) => {
    socket.join(chatId);
    console.log(`User ${socket.id} joined chat: ${chatId}`);
  });

  socket.on("sendMessage", async ({ chatId, content, senderId }) => {
    try {
      const chat = await Chat.findById(chatId);
      if (!chat || !chat.participants.includes(senderId)) return;

      const message = { sender: senderId, content, timestamp: new Date() };
      chat.messages.push(message);
      await chat.save();

      global.io.to(chatId).emit("newMessage", { chatId, ...message });
      console.log("Message émis via newMessage:", { chatId, ...message });

      const otherParticipant = chat.participants.find(p => p.toString() !== senderId);
      if (otherParticipant) {
        const sender = await userModel.findById(senderId, "fullname");
        const senderName = sender ? sender.fullname : senderId;
        const notificationMessage = `${senderName} vous a envoyé un message: "${content}"`;

        global.io.to(chatId).emit("newNotification", {
          chatId,
          senderId,
          recipientId: otherParticipant,
          message: notificationMessage,
          timestamp: new Date()
        });

        console.log("Notification émise:", {
          recipientId: otherParticipant,
          message: notificationMessage
        });
      }
    } catch (error) {
      console.error("❌ Error sending message:", error);
    }
  });

  socket.on("typing", async ({ chatId, senderId }) => {
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(senderId)) return;

    const otherParticipant = chat.participants.find(p => p.toString() !== senderId);
    if (otherParticipant) {
      const sender = await userModel.findById(senderId, "fullname");
      const senderName = sender ? sender.fullname : senderId;
      global.io.to(chatId).emit("userTyping", {
        chatId,
        senderId,
        senderName,
        recipientId: otherParticipant
      });
    }
  });

  socket.on("stopTyping", ({ chatId, senderId }) => {
    global.io.to(chatId).emit("userStoppedTyping", { chatId, senderId });
  });

  socket.on("disconnect", () => {
    console.log(`🔴 Socket disconnected: ${socket.id}`);
    if (socket.userId) {
      if (global.connectedUsers instanceof Set) {
        global.connectedUsers.delete(socket.userId);
        console.log(`❌ User ${socket.userId} removed. Connected Users:`, Array.from(global.connectedUsers));
        global.io.emit("userOnline", Array.from(global.connectedUsers));
      } else {
        console.error("❌ global.connectedUsers is not a Set in disconnect event:", global.connectedUsers);
      }
    }
  });

  // Rejoindre une conversation de projet
  socket.on("joinProjectConversation", (projectId) => {
    socket.join(projectId);
    console.log(`User ${socket.id} joined project conversation: ${projectId}`);
  });

  // Quitter une conversation de projet
  socket.on("leaveProjectConversation", (projectId) => {
    socket.leave(projectId);
    console.log(`User ${socket.id} left project conversation: ${projectId}`);
  });

  // Écouter les nouveaux messages de projet
  socket.on("newProjectMessage", async ({ projectId, senderId, content }) => {
    try {
      const sender = await userModel.findById(senderId, 'fullname');
      const message = {
        sender: senderId,
        senderName: sender.fullname,
        content,
        timestamp: new Date()
      };

      global.io.to(projectId).emit('newProjectMessage', {
        projectId,
        message
      });
    } catch (error) {
      console.error("❌ Error sending project message:", error);
    }
  });
});

startNotificationJob();

// 🟢 Start Server
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

module.exports = app;