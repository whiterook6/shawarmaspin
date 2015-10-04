// Require dependencies
var express = require('express'),
	http = require('http'),
	mysql = require('mysql'), // https://github.com/felixge/node-mysql/
	_prompt = require('prompt'); // https://github.com/flatiron/prompt

var env = process.env.NODE_ENV || 'development';
var config = require('./config/config.js');
require('./lib')();


// get password and connection info
_prompt.start();
_prompt.get({properties: {
	db_pass: {
		required: true,
		hidden: true
	}
}}, function(err, input){
	if (err){
		Logger.message("Error prompting.\n" + err);
		return;
	}

	// Connect to DB
	pool = mysql.createPool({
		connectionLimit: 100,
		host: config.database.host,
		user: config.database.username,
		password: input.db_pass,
		database: config.database.database,
		debug: false
	});

	// Create Server
	var app = express();
	app.use(express.static(__dirname + '/public'));

	var server = http.createServer(app);
		io = require('socket.io').listen(server);

	io.sockets.on('connection', Socket.connect);

	setInterval(function(){
		Player.emit_online_players();
		Player.emit_high_scores();
		Team.emit_team_high_scores();
	}, 5000);

	server.listen(config.server.port);
	Logger.message('Shawarmaspin running...');
});
