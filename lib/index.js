module.exports = function() {
	this.DB = require('./db.js');
	this.Player = require('./player.js');
	this.Team = require('./team.js');
	this.Socket = require('./socket.js');
}
