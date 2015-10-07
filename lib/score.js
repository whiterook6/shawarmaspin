var Score = {

	// broadcast high score boards for players
	emit_high_scores: function() {
		DB.db_call("SELECT `initials`, TIMESTAMPDIFF(SECOND, connected_at, last_ping) AS `score_seconds`" +
			" FROM `players`" +
			" ORDER BY `score_seconds` DESC LIMIT 10", [], "Querying for high scores", function(results){
				Socket.io.sockets.emit('high_scores', results);
			});
	},

	// Updates for player
	// set 0 score (eg for new initials)
	reset_score: function(socket) {
		if (!socket || !socket.player_id){
			Logger.message('Error resetting score: player_id is falsey.');
			return;
		}

		DB.db_call("UPDATE `players` SET `score_seconds` = 0, `last_ping` = CURRENT_TIMESTAMP WHERE `id` = ?",
			[socket.player_id],
			"Resetting score",
			function(results){
				if (results.changedRows > 0){
					socket.start_time = Timer.now();
					socket.emit('score_minutes', 0);
				}
			});
	},

	// charge player: reduces a player's score by a set amount by moving the connected_at time forward by that amount.
	// spins: int of minutes to move the connected forward (positive values decrease the resulting score)
	charge_player: function(socket, spins){
		if (!socket){
			Logger.message("Error charging player: socket is falsey");
			return;
		} else if (!socket.player_id){
			Logger.message("Error charging player: socket.player_id is falsey");
			return;
		}

		DB.db_call("UPDATE `players` SET `score_seconds` = `score_seconds` - '?' WHERE `id` = ?",
			[spins * 60, socket.player_id], // note that spins per second is 1/60, so we subtract 60 seconds per spin.
			"charging a player "+spins+" spins");
	},

	// subtract a number of spins from a whole team (not including dead players)
	charge_team: function(team, spins){
		if (!team){
			Logger.message("Error charging team: team is falsey");
			return;
		}

		DB.db_call("UPDATE `players` SET `score_seconds` = `score_seconds` - '?' WHERE `team` = ? AND TIMESTAMPDIFF(MINUTE, last_ping, NOW()) < 1",
			[spins * 60, team], // see comment in charge_player
			"charging team "+team+" "+spins+" spins.");
	}
};

module.exports = Score;
