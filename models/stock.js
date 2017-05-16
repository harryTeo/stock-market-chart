var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
	name: {type: String, required: true},
	description: {type: String, required: true},
	addedAt: {type: Date, default: Date.now}
});

module.exports = mongoose.model("Stock", schema);