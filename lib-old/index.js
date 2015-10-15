module.exports = function() {
	this.Timer = require('./timer.js');
	this.Logger = require('./logger.js');
	this.Chat = require('./chat.js');
	this.DB = require('./db.js');
	this.Score = require('./score.js');
	this.Player = require('./player.js');
	this.Team = require('./team.js');
	this.Socket = require('./socket.js');
	this.Attacks = require('./attacks.js');
};
