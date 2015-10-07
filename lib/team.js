var Team = {
	enable: function(socket) {
		socket.on('set_team', function(data){
			if (!socket.team && data == socket.team) {
				return;
			}

			if (socket.team){
				socket.leave(socket.team);
			}

			if (data){
				if (data != socket.team){
					Team.join(socket, data);
				}
			} else {
				Team.leave(socket);
			}
			socket.emit('team.joined', socket.team);
		});
	},

	/**
	 * Join given team name
	 */
	join: function(socket, team_name) {
		socket.team = team_name.trim().toUpperCase().substring(0, 3);
		socket.join(socket.team);
		Team.update_team(socket);
		return socket.team;
	},

	/**
	 * Leaves current team
	 */
	leave: function(socket) {
		socket.team = null;
		Team.update_team(socket);
		return socket.team;
	},

	// broadcast board for high team scores
	emit_team_high_scores: function() {
		DB.db_call(" SELECT" +
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
				Socket.io.sockets.emit('team_high_scores', results);
			});
	},

	// save player team
	update_team: function(socket) {
		if (!socket || !socket.player_id){
			Logger.message('Error updating team: socket.player_id is falsey.');
			return;
		}

		DB.db_call("UPDATE `players` SET `team` = ? WHERE `id` = ?",
			[socket.team, socket.player_id],
			"Updating player team",
			function(results){
				if (results.changedRows === 0){
					Logger.message("Warning updating player team: No changed rows.");
				}
			});
	},

	send_team_online: function(socket){
		if (!socket || !socket.team){
			return;
		}

		DB.db_call("SELECT `initials`, TIMESTAMPDIFF(SECOND, connected_at, last_ping) AS `score_seconds`" +
			" FROM `players` WHERE TIMESTAMPDIFF(MINUTE, last_ping, NOW()) < 1" +
			" AND `team` = ? ORDER BY `score_seconds` DESC ",
			[socket.team],
			"Getting team for player "+socket.initials, function(results){
				socket.emit('team_online', results);
			});
	}
};

module.exports = Team;
