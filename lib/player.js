var Player = {
	enable: function(socket) {
		this.create_player(socket);

		socket.on('set_initials', function(data){
			if (data && data != socket.initials){
				Player.update_initials(socket, data);
				Player.reset_score(socket);
			}
			socket.emit('player.renamed', socket.initials);
		});

		socket.emit('player.created');
	},
	// Broadcast
	// broadcast who's online boards
	emit_online_players: function() {
		DB.db_call("SELECT `initials`, `team`, TIMESTAMPDIFF(SECOND, connected_at, last_ping) AS `score_seconds`" +
			" FROM `players`" +
			" WHERE TIMESTAMPDIFF(MINUTE, last_ping, NOW()) < 1" +
			" ORDER BY `score_seconds` DESC",
			[],
			"Querying for online players",
			function(results){
				io.sockets.emit('online', results);
			});
	},

	// broadcast high score boards for players
	emit_high_scores: function() {
		DB.db_call("SELECT `initials`, TIMESTAMPDIFF(SECOND, connected_at, last_ping) AS `score_seconds`" +
			" FROM `players`" +
			" ORDER BY `score_seconds` DESC LIMIT 10", [], "Querying for high scores", function(results){
				io.sockets.emit('high_scores', results);
			});
	},

	// Updates for player
	// set 0 score (eg for new initials)
	reset_score: function(socket) {
		if (!socket || !socket.player_id){
			Logger.message('Error resetting score: player_id is falsey.');
			return;
		}

		DB.db_call("UPDATE `players` SET `connected_at` = CURRENT_TIMESTAMP, `last_ping` = CURRENT_TIMESTAMP WHERE `id` = ?",
			[socket.player_id],
			"Resetting score",
			function(results){
				if (results.changedRows > 0){
					socket.start_time = Timer.now();
					socket.emit('score_minutes', 0);
				}
			});
	},

	// save player initials
	update_initials: function(socket, initials) {
		if (!socket || !socket.player_id){
			Logger.message('Error updating initials: socket.initials is falsey.');
			return;
		}

		socket.initials = initials.trim().toUpperCase().substring(0, 3);
		DB.db_call("UPDATE `players` SET `initials` = ? WHERE `id` = ?",
			[socket.initials, socket.player_id],
			"Updating player initials",
			function(results){
				if (results.changedRows === 0){
					Logger.message("Warning updating player initials: No changed rows.");
				}
			});
	},

	// create player
	create_player: function(socket) {
		var msg;

		if (!socket){
			msg = 'Cannot create player: socket is falsey.';
			Logger.message(msg);
			return;
		}

		if (!socket || !socket.initials){
			msg = 'Cannot create player: socket.initials is falsey.';
			Logger.message(msg);
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
				Logger.message(msg+': '+error);
				socket.emit('error', msg);
				socket.disconnect();
				return;
			}

			var query = connection.query("INSERT INTO `players` (`ip`, `initials`, `team`, `connected_at`) VALUES (INET_ATON(?), ?, ?, NOW())", [ip, initials, team], function(error, result){
				connection.release();

				if (error){
					Logger.message("ERROR creating player: "+error);
					socket.emit('error', 'ERROR creating player: Query error.');
					socket.disconnect();
					return;
				}

				socket.player_id = result.insertId;
			});
		});
	},

	// ping player: updates players most recent ping time in table to update who's online and update their scores too.
	ping_player: function(socket) {
		if (!socket){
			Logger.message('Error updating player ping time: socket is falsey.');
			return;
		} else if (!socket.player_id){
			Logger.message('Error updating player ping time: socket.player_id is falsey.');
			return;
		}

		DB.db_call("UPDATE `players` SET `last_ping` = CURRENT_TIMESTAMP WHERE `id` = ?",
			[socket.player_id],
			"Updating player last_ping",
			function(results){
				if (results.changedRows > 0){
				}
			});
	}
};

module.exports = Player;
