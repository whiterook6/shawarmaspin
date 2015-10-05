// Require dependencies
var express = require('express'),
	http = require('http'),
	mysql = require('mysql'), // https://github.com/felixge/node-mysql/
	_prompt = require('prompt'); // https://github.com/flatiron/prompt

var Promise = require('bluebird');
Promise.promisifyAll(require("mysql/lib/Pool").prototype);
Promise.promisifyAll(require("mysql/lib/Connection").prototype)

var env = process.env.NODE_ENV || 'development';
var config = require('./config/config.js');
require('./lib')();

// Create Server
var app = express();
app.use(express.static(__dirname + '/public'));
var server = http.createServer(app);
io = require('socket.io').listen(server);
io.sockets.on('connection', Socket.connect);

// make pool global so it's available everywhere
// this is bad and will need to be changed
pool = null;
var Server = {
	connectDB: function(pass) {
		pool = mysql.createPool({
			connectionLimit: 100,
			host: config.database.host,
			user: config.database.username,
			password: pass,
			database: config.database.database,
			debug: false
		});

		setInterval(function(){
			Player.emit_online_players();
			Score.emit_high_scores();
			Team.emit_team_high_scores();
		}, 5000);
	},
	start: function() {
		server.listen(config.server.port);
		Logger.message('Shawarmaspin running...');
	},
	stop : function() {
		server.close();
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

		Server.connectDB(input);
		Server.start();
	});
} else {
	Server.connectDB(config.database.password);
	Server.start();
}
