var express = require('express');
var router = express.Router();

var Stock = require('../models/stock');

router.get('/', nocache, function(req, res, next) { // Home Page
	Stock.find({}).sort({addedAt: 1}).exec(function(err, docs) {
		res.render('index', { stocks: docs });
	}); 	
});

router.get("/stocks", function(req, res, next) {
	Stock.find({}, {_id: 0, __v: 0}).sort({addedAt: 1}).exec(function(err, docs) {
		if (err) throw err;
		return res.json(docs);
	});	
});

function nocache(req, res, next) { // middleware in order to turn off caching -> page reloads on revisit, even when using the back button
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  next();
}

module.exports = router;