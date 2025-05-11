var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors');
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
var chatRouter = require('./routes/ChatRoutes');
var userLogsRoutes = require('./routes/UserLogsRoutes');
var logsRoutes = require('./routes/logsRoutes');

var app = express();
var mongoose = require("mongoose");
var connection = require("./config/database.json");

// 🟢 MongoDB Connection
mongoose.connect(connection.url)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ Error connecting to MongoDB:", err));

// 🟢 Enable CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5000', '*'],
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

app.post('/api/test2', (req, res) => {
  const requestBody = req.body;
  res.status(200).json({
    message: 'POST test endpoint working!',
    receivedData: requestBody,
  });
});

// 🟢 Start Server (For Local Testing Only, Not Used in Netlify Functions)
const PORT = 5000;
app.listen(PORT, () => {
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

// 🟢 Wrap App for Netlify Functions
const serverless = require('serverless-http');
module.exports.handler = serverless(app);

// Remove duplicate export
// module.exports = app; // Remove this line