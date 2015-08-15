// handy timestamp logging message
function log_message(message){
	console.log('['+new Date().toUTCString()+']: '+message);
}

function debug_message(message){
	log_message(message);
}

// timestamp for getting scores
function now(){
	return (new Date() / 1000.0);
}

// Broadcast
// broadcast who's online boards
function emit_online_players(){
	pool.getConnection(function(error, connection){
		if (error){
			log_message("ERROR emitting online players: Cannot get connection: "+error);
			return;
		}

		debug_message('Updating online-now boards...');
		connection.query("SELECT `initials`," +
			" `team`," +
			" TIMESTAMPDIFF(SECOND, connected_at, last_ping) AS `score_seconds`" +
			" FROM `players`" +
			" WHERE TIMESTAMPDIFF(MINUTE, last_ping, NOW()) < 5" +
			" ORDER BY `score_seconds` DESC", [], function(error, results){
			connection.release();
			if (error){
				log_message("ERROR querying for online players: "+error);
				return;
			}

			io.sockets.emit('online', results);
			debug_message('Online Player board updated.');
		});
	});
}

// broadcast high score boards for players
function emit_high_scores(){
	pool.getConnection(function(error, connection){
		if (error){
			log_message("ERROR emitting high scores: cannot get connection: "+error);
			return;
		}

		debug_message("Emitting high scores...");
		connection.query(
			"SELECT `initials`," +
			" TIMESTAMPDIFF(SECOND, connected_at, last_ping) AS `score_seconds`" +
			" FROM `players`" +
			" ORDER BY `score_seconds` DESC LIMIT 10", [], function(error, results){
			connection.release();
			
			if (error){
				log_message("ERROR querying for high scores: "+error);
				return;
			}

			io.sockets.emit('high_score', results);
			debug_message('High Scores board updated.');
		});
	});
}

// broadcast board for high team scores
function emit_team_high_scores(){
	pool.getConnection(function(error, connection){
		if (error){
			log_message("ERROR emitting team high scores: cannot get connection: "+error);
			return;
		}

		debug_message("Emitting team high scores...");
		connection.query("select sum(TIMESTAMPDIFF(SECOND, connected_at, last_ping)) AS `score_seconds`, `team`" +
			" FROM `players`" +
			" WHERE `team` IS NOT NULL" +
			" GROUP BY `team`" +
			" ORDER BY `score_seconds` DESC" +
			" LIMIT 5", [], function(error, results){
			connection.release();
			
			if (error){
				log_message("ERROR querying for team high scores: "+error);
				return;
			}

			io.sockets.emit('team_high_scores', results);
			debug_message('Team High Scores board updated.');
		});
	});
}


// Updates for player
// set 0 score (eg for new initials)
function reset_score(socket){
	if (!socket || !socket.player_id){
		log_message('Error resetting score: player_id is falsey.');
		return;
	}

	pool.getConnection(function(error, connection){
		if (error){
			log_message('Error resetting score: Error getting connection: '+error);
			return;
		}

		connection.query("UPDATE `players` SET `connected_at` = CURRENT_TIMESTAMP, `last_ping` = CURRENT_TIMESTAMP WHERE `player_id` = ?", [socket.player_id], function(error, result){
			connection.release();
			if (error){
				log_message("ERROR resetting score: "+error);
			} else if (result.changedRows === 0){
				log_message("ERROR resetting score: No changed rows.");
			} else {
				debug_message("player score updated.");
				socket.start_time = now();
				socket.emit('score', '0.000');
			}
		});
	});
}

// update player team
function update_team(socket){
	if (!socket || !socket.player_id || !socket.team){
		log_message('Error updating team: socket.team is falsey.');
		return;
	}

	pool.getConnection(function(error, connection){
		if (error){
			log_message('Error updating team: Error getting connection: '+error);
			return;
		}

		connection.query("UPDATE `players` SET `team` = ? WHERE `player_id` = ?", [socket.team, socket.player_id], function(error, result){
			connection.release();
			if (error){
				log_message("ERROR updating player team: "+error);
			} else if (result.changedRows === 0){
				log_message("ERROR updating player team: No changed rows.");
			} else {
				debug_message("Player team updated.");
			}
		});
	});
}

// update player initials
function update_initials(socket){
	if (!socket || !socket.player_id || !socket.initials){
		log_message('Error updating initials: socket.initials is falsey.');
		return;
	}

	pool.getConnection(function(error, connection){
		if (error){
			log_message('Error updating initials: Error getting connection: '+error);
			return;
		}

		connection.query("UPDATE `players` SET `initials` = ? WHERE `player_id` = ?", [socket.initials, socket.player_id], function(error, result){
			connection.release();
			if (error){
				log_message("ERROR updating player initials: "+error);
			} else if (result.changedRows === 0){
				log_message("ERROR updating player initials: No changed rows.");
			} else {
				debug_message("Player initials updated.");
			}
		});
	});
}

// create player
function create_team(socket){
	var msg;

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
				socket.disconnect();
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

	pool.getConnection(function(error, connection){
		if (error){
			log_message('Error updating ping time: error getting pool connection: '+error);
			return;
		}

		debug_message('Pinging player');
		var query = connection.query("UPDATE `players` SET `last_ping` = CURRENT_TIMESTAMP WHERE `id` = ?", [socket.player_id], function(error, result){
			connection.release();
			if (error){
				log_message("ERROR updating player last_ping: "+error);
			} else if (result.changedRows === 0){
				log_message("ERROR updating player last_ping: No changed rows.");
			} else {
				debug_message("Player last ping updated.");
			}
		});
	});
}

// Single Player messages
// send single score to socket
function send_score(socket){
	var elapsed_time = now() - socket.start_time,
		score = elapsed_time / 60.0;

	socket.emit('score', score.toFixed(3));
}

// update score and team score
function send_scores(socket){
	var elapsed_time = now() - socket.start_time,
		score = elapsed_time / 60.0;

	socket.emit('score', score.toFixed(3));

	if (!socket.team){
		return;
	}

	pool.getConnection(function(error, connection){
		if (error){
			log_message("ERROR getting team score: cannot get connection: "+error);
			return;
		}

		connection.query("SELECT SUM(TIMESTAMPDIFF(SECOND, connected_at, last_ping)) AS `score_seconds`, `team`" +
			" FROM `players`" +
			" WHERE `team` = '?'" +
			" AND `id` != ?", [socket.team, socket.player_id], function(error, results){
			connection.release();
			
			if (error){
				log_message("ERROR querying for team score: "+error);
				return;
			}

			var team_score = (parseInt(results[0]['score_seconds'], 10)+score);

			io.sockets.emit('team_score', team_score.toFixed(3));
		});
	});
}

// connect new socket
function connect_socket(socket){
	socket.start_time = now();
	socket.initials = 'unk';
	create_player(socket);
	socket.last_ping_interval = setInterval(function(){
		if (socket.player_id){
			ping_player(socket);
		}
	}, 10000);

	socket.on('set_initials', function(data){

	});

	socket.on('set_team', function(data){

	});

	socket.on('message', function(data){

	});

	socket.on('set_initials', function(data){
		socket.initials = data.trim().toUpperCase().substring(0, 3);
		create_player(socket);

		if (socket.score_send_interval){
			clearInterval(socket.score_send_interval);
		}

		if (socket.last_ping_interval){
			clearInterval(socket.last_ping_interval);
		}

		socket.score_send_interval = setInterval(function(){
			var elapsed_time = now() - socket.start_time,
				score = elapsed_time / 60.0;

			socket.emit('score', score.toFixed(3));
		}, 5000);

		socket.last_ping_interval = setInterval(function(){
			if (socket.player_id){
				ping_player(socket);
			}
		}, 10000);
	});

	socket.on('disconnect', function(){
		clearInterval(socket.score_send_interval);
		clearInterval(socket.last_ping_interval);
	});
}


// GO
// Begin
log_message('Shawarmaspin starting up...');

// Require dependencies
var express = require('express'),
	http = require('http'),
	socket_io = require('socket.io'),
	mysql = require('mysql'); // https://github.com/felixge/node-mysql/
debug_message('Dependencies loaded...');

// Connect to DB
pool = mysql.createPool({
	connectionLimit: 100,
	host: 'localhost',
	user: 'root',
	password: 'Yorkfi3ld',
	database: 'shawarma',
	debug: false
});
debug_message('DB Pool established.');

// Create Server
var app = express();
app.use(express.static(__dirname + '/public'));

var server = http.createServer(app);
	io = require('socket.io').listen(server);
debug_message('Servers ready...');












debug_message('Starting Server...');
server.listen(80);
log_message('Shawarmaspin Webserver running...');
