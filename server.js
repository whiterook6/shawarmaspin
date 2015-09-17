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

// Broadcast
// broadcast who's online boards
function emit_online_players(){
	db_call("SELECT `initials`, `team`, TIMESTAMPDIFF(SECOND, connected_at, last_ping) AS `score_seconds`" +
		" FROM `players`" +
		" WHERE TIMESTAMPDIFF(MINUTE, last_ping, NOW()) < 1" +
		" ORDER BY `score_seconds` DESC",
		[],
		"Querying for online players",
		function(results){
			io.sockets.emit('online', results);
			debug_message('Online Player board updated.');
		});
}

// broadcast high score boards for players
function emit_high_scores(){
	db_call("SELECT `initials`, TIMESTAMPDIFF(SECOND, connected_at, last_ping) AS `score_seconds`" +
		" FROM `players`" +
		" ORDER BY `score_seconds` DESC LIMIT 10", [], "Querying for high scores", function(results){
			io.sockets.emit('high_scores', results);
			debug_message('High Scores board updated.');
		});
}

// broadcast board for high team scores
function emit_team_high_scores(){
	db_call("select sum(TIMESTAMPDIFF(SECOND, connected_at, last_ping)) AS `score_seconds`, `team`" +
		" FROM `players`" +
		" WHERE `team` IS NOT NULL" +
		" GROUP BY `team`" +
		" ORDER BY `score_seconds` DESC" +
		" LIMIT 5", [], "Querying for team high scores", function(results){
			io.sockets.emit('team_high_scores', results);
			debug_message('Team High Scores board updated.');
		});
}

// Updates for player
// set 0 score (eg for new initials)
function reset_score(socket){
	if (!socket || !socket.player_id){
		log_message('Error resetting score: player_id is falsey.');
		return;
	}

	db_call("UPDATE `players` SET `connected_at` = CURRENT_TIMESTAMP, `last_ping` = CURRENT_TIMESTAMP WHERE `id` = ?",
		[socket.player_id],
		"Resetting score",
		function(results){
			if (results.changedRows > 0){
				debug_message("player score updated.");
				socket.start_time = now();
				socket.emit('score', '0.000');
			}
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

// save player initials
function update_initials(socket){
	if (!socket || !socket.player_id || !socket.initials){
		log_message('Error updating initials: socket.initials is falsey.');
		return;
	}

	db_call("UPDATE `players` SET `initials` = ? WHERE `id` = ?",
		[socket.initials, socket.player_id],
		"Updating player initials",
		function(results){
			if (results.changedRows === 0){
				debug_message("Warning updating player initials: No changed rows.");
			} else {
				debug_message("Player initials updated: " +socket.initials);
			}
		});
}

// attempt to reconnect player (if less than a minute)
function reconnect(socket){
	if (!socket){
		msg = 'Cannot reconnect player: no socket.';
		log_message(msg);
		return;
	}

	ip = socket.request.connection.remoteAddress;
	pool.getConnection(function(error, connection){
		if (error){
			msg = 'Cannot reconnect player: Cannot get connection';
			log_message(msg+': '+error);
			socket.emit('error', msg);
			socket.disconnect();
			return;
		}

		var query = connection.query("SELECT `ip`, `id`, `connected_at`, `initials`, TIMESTAMPDIFF(SECOND, connected_at, last_ping) AS `score_seconds`, `team`" +
			" FROM `players` WHERE `ip` = INET_ATON(?) AND TIMESTAMPDIFF(MINUTE, last_ping, NOW()) < 1 ORDER BY `last_ping` DESC LIMIT 1", [ip], function(error, results){
			connection.release();
			if (error){
				log_message("Error reconnecting player. Creating new player instead.");
				create_player(socket);
			} else if (results.length === 0){
				create_player(socket);
			} else {
				result = results[0];
				socket.initials = result.initials;
				socket.team = result.team;
				socket.player_id = result.id;
				socket.start_time = then(result.connected_at);
				ping_player(socket);

				socket.emit('new_initials', result.initials);
				if (result.team){
					socket.emit('new_team', result.team);
				}
			}
		});
	});
}

// create player
function create_player(socket){
	var msg;

	if (!socket){
		msg = 'Cannot create player: socket is falsey.';
		log_message(msg);
		return;
	}

	if (!socket || !socket.initials){
		msg = 'Cannot create player: socket.initials is falsey.';
		log_message(msg);
		socket.emit('error', msg);
		socket.disconnect();

		return;
	}

	var initials = socket.initials,
		ip = socket.request.connection.remoteAddress,
		team = null;

	if (socket.team){
		team = socket.team;
	}

	pool.getConnection(function(error, connection){
		if (error){
			msg = 'Cannot create player: Cannot get connection';
			log_message(msg+': '+error);
			socket.emit('error', msg);
			socket.disconnect();
			return;
		}

		var query = connection.query("INSERT INTO `players` (`ip`, `initials`, `team`) VALUES (INET_ATON(?), ?, ?)", [ip, initials, team], function(error, result){
			connection.release();

			if (error){
				log_message("ERROR creating player: "+error);
				socket.emit('error', 'ERROR creating player: Query error.');
				socket.disconnect();
				return;
			}

			socket.player_id = result.insertId;
			debug_message('player '+initials+' from '+ip+' inserted (id='+result.insertId+')');
		});
	});
}

// ping player: updates players most recent ping time in table to update who's online and update their scores too.
function ping_player(socket){
	if (!socket){
		log_message('Error updating player ping time: socket is falsey.');
		return;
	} else if (!socket.player_id){
		log_message('Error updating player ping time: socket.player_id is falsey.');
		return;
	}

	db_call("UPDATE `players` SET `last_ping` = CURRENT_TIMESTAMP WHERE `id` = ?",
		[socket.player_id],
		"Updating player last_ping",
		function(results){
			if (results.changedRows > 0){
				debug_message("Player last ping updated.");
			}
		});
}

function send_score(socket){
	var elapsed_time = now() - socket.start_time,
		score = elapsed_time / 60.0;

	socket.emit('score_minutes', score.toFixed(3));
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

function set_update_player_interval(socket){
	if (socket.update_player_interval){
		clearInterval(socket.update_player_interval);
	}

	debug_message('Setting update player interval');

	socket.update_player_interval = setInterval(function(){
		ping_player(socket);
		send_score(socket);
		send_team_online(socket);
	}, 5000);
}

// connect new socket
function connect(socket){
	debug_message('Connecting socket');
	socket.start_time = now();
	socket.initials = 'unk';
	reconnect(socket); // will create player if it doesn't work.
	set_update_player_interval(socket);

	socket.on('set_initials', function(data){
		if (data && data != socket.initials){
			socket.initials = data.trim().toUpperCase().substring(0, 3);
			
			debug_message('Incoming initials: '+socket.initials);
			update_initials(socket);
			reset_score(socket);
		}
	});

	socket.on('set_team', function(data){
		if (socket.team){
			socket.leave(socket.team);
		}

		if (data){
			if (data != socket.team){
				socket.team = data.trim().toUpperCase().substring(0, 3);
				socket.join(socket.team);
				
				debug_message('Incoming team: '+socket.team);
				update_team(socket);
			}
		} else {
			socket.team = null;
			
			debug_message('Incoming team: null');
			update_team(socket);
		}
	});

	socket.on('message', function(data){
		if (socket.last_message && (now() - socket.last_message) < 10){
			return;
		}

		var message = {
			initials: socket.initials,
			message: data
		};

		if (socket.team){
			message.team = socket.team;
			socket.broadcast.to(socket.team).emit('message', message);
		} else {
			socket.broadcast.emit('message', message);
		}

		socket.last_message = now();
	});

	socket.on('disconnect', function(){
		disconnect(socket);
	});
}

function disconnect(socket){
	if (socket.update_player_interval){
		clearInterval(socket.update_player_interval);
	}
	debug_message('Player '+socket.initials+' disconnecting.');

	socket.disconnect();
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

	io.sockets.on('connection', connect);

	setInterval(function(){
		emit_online_players();
		emit_high_scores();
		emit_team_high_scores();
	}, 5000);

	debug_message('Starting Server...');
	server.listen(8080);
	log_message('Shawarmaspin Webserver running...');
});