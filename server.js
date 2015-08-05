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

// create the player
function create_player(socket){
	debug_message('Creating player...');
	var initials = socket.initials,
		ip = socket.request.connection.remoteAddress;

	pool.getConnection(function(error, connection){
		if (error){
			socket.disconnect();
			log_message("ERROR getting connection from pool to create player: "+error);
			return;
		}

		var query = connection.query("INSERT INTO `players` (`ip`, `initials`) VALUES (INET_ATON(?), ?)", [ip, initials], function(error, result){
			connection.release();

			if (error){
				socket.disconnect();
				log_message("ERROR creating player: "+error);
				return;
			}

			socket.player_id = result.insertId;
			debug_message('player '+initials+' from '+ip+' inserted (id='+result.insertId+')');
		});
	});
}

// update the player's most recent ping time
function ping_player(socket){
	if (!socket.player_id){
		return;
	}

	debug_message('Setting last_ping for player...');
	pool.getConnection(function(error, connection){
		if (error){
			log_message("ERROR get connection from pool to update player: "+error);
			return;
		}

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

function emit_online_players(){
	pool.getConnection(function(error, connection){
		if (error){
			log_message("ERROR emitting online players: Cannot get connection: "+error);
			return;
		}

		debug_message('Updating online-now boards...');
		connection.query("SELECT `initials`," +
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

function emit_high_scores(){
	pool.getConnection(function(error, connection){
		if (error){
			log_message("ERROR emitting high scores: cannot get connection: "+error);
			return;
		}

		debug_message("Emitting high scores...");
		connection.query("SELECT `initials`," +
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

// Handle the socket.io connections
io.sockets.on('connection', function (socket) {
	socket.start_time = now();

	socket.on('setInitials', function(data){
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
});

// emit online players:
setInterval(function(){
	emit_online_players();
	emit_high_scores();
}, 10000);

debug_message('Starting Server...');
server.listen(80);
log_message('Shawarmaspin Webserver running...');