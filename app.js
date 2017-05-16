var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var hbs = require('hbs');
var mongoose = require('mongoose');

require('dotenv').config();

var index = require('./routes/index');

var app = express();
var server = require('http').Server(app); // This is normally done in ./bin/www but we're going to move it here and export it
var io = require('socket.io')(server); // Set up our websockets server to run in the same app

mongoose.connect(process.env.MONGOLAB_URI);
mongoose.Promise = global.Promise;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
// Register handlebars(hbs) partials
hbs.registerPartials(__dirname + '/views/partials');


// socket.io middleware
var Stock = require('./models/stock');
io.on('connection', function(socket){
	// Add Stock on database
	socket.on('addStock', function(data, callbackFunction) { // callbackFunction only relates to the client who initiated the event. It is used here to CONFIRM correct data reception
		var newStock = new Stock({
			name: data.name,
			description: data.description
		});
		newStock.save(function(err, result) {
			if(err) {
				callbackFunction(null);
				throw err;
			}
			else {
				callbackFunction(data);
				socket.broadcast.emit('addStock', data); // Emit to all the other clients except for the socket whose connection event is being handled (since already received stock data from API)
				// else io.sockets.emit('addStock', data); // Emit to all clients
			}
		});
	});
	// Delete Stock from database
  socket.on('deleteStock', function(data, callbackFunction){
		Stock.findOneAndRemove({name: data.name}, function (err, stock){
			if(err) {
				callbackFunction(null);
				throw err;
			}
			else {
				callbackFunction(data);
				socket.broadcast.emit('deleteStock', data);
			}			
		});    
  });
});
// app.use(function(req, res, next){ // socket.io middleware, in order to add socket.io to res in our event loop -> then I could use it by typing e.g. res.io.emit(...)
//   res.io = io;
//   next();
// });

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  var errorStatus = err.status || 500;
  var errorMessage = errorStatus == 500 ? "Internal Server Error - Please try again later" : "Page Not Found!";

  // render the error page
  res.status(errorStatus).render('error', { errorStatus: errorStatus, errorMessage: errorMessage });  
});

module.exports = {app: app, server: server};