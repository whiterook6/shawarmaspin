// Require dependencies
var express = require('express'),
	http = require('http'),
	socket_io = require('socket.io'),
	mysql = require('mysql'), // https://github.com/felixge/node-mysql/
	_prompt = require('prompt'); // https://github.com/flatiron/prompt

require('./lib')();
Logger.message('Shawarmaspin starting up...')
Logger.message('Dependencies loaded...');

// get password and connection info
_prompt.start();
_prompt.get({properties: {
	db_host: {
		required: true,
		default: 'localhost'
	},
	db_user: {
		required: true,
		default: 'root'
	},
	db_pass: {
		required: true,
		hidden: true
	}
}}, function(err, result){
	if (err || !result.db_host || !result.db_user || !result.db_pass){
		Logger.message("Error prompting.");
		return;
	}

	// Connect to DB
	pool = mysql.createPool({
		connectionLimit: 100,
		host: result.db_host,
		user: result.db_user,
		password: result.db_pass,
		database: 'shawarma_team',
		debug: false
	});
	Logger.message('DB Pool established.');

	// Create Server
	var app = express();
	app.use(express.static(__dirname + '/public'));

	var server = http.createServer(app);
		io = require('socket.io').listen(server);
	Logger.message('Servers ready...');

	io.sockets.on('connection', Socket.connect);

	setInterval(function(){
		Player.emit_online_players();
		Player.emit_high_scores();
		Team.emit_team_high_scores();
	}, 5000);

	Logger.message('Starting Server...');
	server.listen(8080);
	Logger.message('Shawarmaspin Webserver running...');
});
