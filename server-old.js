// Require dependencies
var express = require('express'),
	http = require('http'),
	mysql = require('mysql'), // https://github.com/felixge/node-mysql/
	_prompt = require('prompt'), // https://github.com/flatiron/prompt
	promise = require('bluebird');

promise.promisifyAll(require("mysql/lib/Pool").prototype);
promise.promisifyAll(require("mysql/lib/Connection").prototype);

var env = process.env.NODE_ENV || 'development';
var config = require('./config/config.js');

require('./lib')();

// Create Server
var app = express();
app.use(express.static(__dirname + '/public'));

var server = http.createServer(app);
Socket.io = require('socket.io').listen(server);
Socket.io.sockets.on('connection', Socket.connect);

var Server = {
	connect_db: function(pass) {
		config.database.connectionLimit = 100;
		config.database.password = pass;
		config.database.debug = false;
		
		DB.pool = mysql.createPool({
			connectionLimit: config.database.connectionLimit,
			host: config.database.host,
			user: config.database.username,
			password: config.database.password,
			database: config.database.database,
			debug: config.database.debug
		});
	},

	disconnect_db: function(){
		if (DB.pool){
			DB.pool.end(function(error){
				Logger.message("Connection Pool shut down.");
			});
			Logger.message("Shutting down Connection Pool.");
		}
	},

	start: function() {
		server.listen(config.server.port);

		setInterval(function(){
			Player.emit_online_players();
			Score.emit_high_scores();
			Team.emit_team_high_scores();
		}, 5000);

		Logger.message('Shawarmaspin running.');
	},

	stop: function() {
		Logger.message("Shutting down server.");
		server.close();
	},

	// called regularly with the time since the previous tick. Might be a float.
	tick: function(delay_seconds){

	}
};

// get password and connection info
if( !config.database.password ) {
	_prompt.start();
	_prompt.get({properties: {
		db_pass: {
			required: true,
			hidden: true,
			default: 'password'
		}
	}}, function(err, input){
		if (err) {
			Logger.message("Error prompting.\n" + err);
			return;
		}

		Server.connect_db(input);
		Server.start();
	});
} else {
	Server.connect_db(config.database.password);
	Server.start();
}

module.exports = Server;
