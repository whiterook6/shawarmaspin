// handy timestamp logging message
function log_message(message){
	console.log('['+new Date().toUTCString()+']: '+message);
}

function debug_message(message){
	// log_message(message);
}

// timestamp for getting scores
function now(){
	return (new Date() / 1000.0);
}

function then(mysql_date){
	return (new Date(mysql_date) / 1000.0);
}

// helper function for running DB calls without special stuff.
function db_call(query, params, error_msg, success_callback){
	pool.getConnection(function(error, connection){
		if (error){
			log_message(error_msg+": Connection error: "+error);
			return;
		}

		connection.query(query, params, function(error, results){
			connection.release();
			if (error){
				log_message(error_msg+": Query error: "+error);
			} else {
				success_callback(results);
			}
		});
	});
}

// broadcast board for high team scores
function emit_team_high_scores(){
	db_call(" SELECT" +
			" SUM(TIMESTAMPDIFF(SECOND, connected_at, last_ping)) AS `score_seconds`," +
			" `team`," +
			" count(CASE WHEN TIMESTAMPDIFF(MINUTE, last_ping, CURRENT_TIMESTAMP) <= 1 THEN 1 END) as `spm`" +
		" FROM" +
			" `players`" +
		" WHERE" +
			" `team` IS NOT NULL" +
		" GROUP BY" +
			" `team`" +
		" ORDER BY" +
			" `score_seconds` DESC LIMIT 5;", [], "Querying for team high scores", function(results){
			io.sockets.emit('team_high_scores', results);
			debug_message('Team High Scores board updated.');
		});
}

// save player team
function update_team(socket){
	if (!socket || !socket.player_id){
		log_message('Error updating team: socket.player_id is falsey.');
		return;
	}

	db_call("UPDATE `players` SET `team` = ? WHERE `id` = ?",
		[socket.team, socket.player_id],
		"Updating player team",
		function(results){
			if (results.changedRows === 0){
				debug_message("Warning updating player team: No changed rows.");
			} else {
				debug_message("Player team updated: "+socket.team);
			}
		});
}

function send_team_online(socket){
	if (!socket || !socket.team){
		return;
	}

	db_call("SELECT `initials`, TIMESTAMPDIFF(SECOND, connected_at, last_ping) AS `score_seconds`" +
		" FROM `players` WHERE TIMESTAMPDIFF(MINUTE, last_ping, NOW()) < 1" +
		" AND `team` = ? ORDER BY `score_seconds` DESC ",
		[socket.team],
		"Getting team for player "+socket.initials, function(results){
			socket.emit('team_online', results);
		});
}


// GO
// Begin
log_message('Shawarmaspin starting up...');

// Require dependencies
var express = require('express'),
	http = require('http'),
	socket_io = require('socket.io'),
	mysql = require('mysql'), // https://github.com/felixge/node-mysql/
	_prompt = require('prompt'); // https://github.com/flatiron/prompt
require('./lib')();
debug_message('Dependencies loaded...');

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
		log_message("Error prompting.");
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
	debug_message('DB Pool established.');

	// Create Server
	var app = express();
	app.use(express.static(__dirname + '/public'));

	var server = http.createServer(app);
		io = require('socket.io').listen(server);
	debug_message('Servers ready...');

	io.sockets.on('connection', Socket.connect);

	setInterval(function(){
		Player.emit_online_players();
		Player.emit_high_scores();
		emit_team_high_scores();
	}, 5000);

	debug_message('Starting Server...');
	server.listen(8080);
	log_message('Shawarmaspin Webserver running...');
});
