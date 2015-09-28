var Team = {
	enable: function(socket) {
		socket.on('set_team', function(data){
			if (socket.team){
				socket.leave(socket.team);
			}

			if (data){
				if (data != socket.team){
					socket.team = data.trim().toUpperCase().substring(0, 3);
					socket.join(socket.team);

					Logger.message('Incoming team: '+socket.team);
					Team.update_team(socket);
				}
			} else {
				socket.team = null;

				Logger.message('Incoming team: null');
				Team.update_team(socket);
			}
			socket.emit('team.joined', socket.team);
		});
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
				io.sockets.emit('team_high_scores', results);
				Logger.message('Team High Scores board updated.');
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
				} else {
					Logger.message("Player team updated: "+socket.team);
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
