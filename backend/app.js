var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var assetsactifsRoutes = require('./routes/assetActifRoutes');
var assetspassifsRoutes = require('./routes/assetPassifRoutes');
var projectRouter = require('./routes/project.router');
var app = express();
var mongo=require("mongoose");
var connection=require("./config/database.json");
mongo.connect(connection.url).then(()=>{
 console.log("connected to db")
}).catch(()=>{
  console.log("error connecting to db")
});
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/project', projectRouter);



// ------------------- ASSETS---------------------
var assetsactifsRoutes = require('./routes/assetActifRoutes');
var assetspassifsRoutes = require('./routes/assetPassifRoutes');
app.use('/assetspassifs', assetspassifsRoutes);
app.use('/assetsactifs', assetsactifsRoutes);
// ------------------- END ASSETS---------------------


// ------------------- TAXE CALCULATIONS---------------------
var taxeRoutes = require('./routes/taxeRoutes');
app.use('/taxes', taxeRoutes);
// ------------------- END TAXE CALCULATIONS---------------------



app.get('/api/test', (req, res) => {
  res.status(200).json({ message: 'Project tested ' });
});
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
