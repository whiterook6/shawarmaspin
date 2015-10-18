var Team = {
	enable: function(socket) {
		Logger.debug('Team.enable');

		socket.on('set_team', function(data){
			if (!data){
				if (socket.player.team){
					Team.leave(socket);
				}

				return;
			}

			var new_team = data.trim().toUpperCase().substring(0, 3);
			if (new_team == socket.player.team){
				return;
			}

			if (socket.player.team){
				socket.leave(socket.player.team);
			}
			
			Team.join(socket, new_team);
			socket.emit('team.joined', socket.player.team);
		});
	},

	/**
	 * Join given team name
	 */
	join: function(socket, team_name) {
		Logger.debug('Team.join');
		socket.player.team = team_name;
		socket.join(socket.player.team);
		Team.update_team_in_db(socket);
		return socket.player.team;
	},

	/**
	 * Leaves current team
	 */
	leave: function(socket) {
		Logger.debug('Team.leave');
		socket.player.team = null;
		Team.update_team_in_db(socket);
		return socket.player.team;
	},

	// save player team
	update_team_in_db: function(socket) {
		Logger.debug('Team.update_team');
		if (!socket || !socket.player_id){
			Logger.error('updating team: socket.player_id is falsey.');
			return;
		}

		DB.query("UPDATE `players` SET `team` = ? WHERE `id` = ?",
			[socket.player.team, socket.player_id],
			"Updating player team",
			function(results){
				if (results.changedRows === 0){
					Logger.warning("Warning updating player team: No changed rows.");
				}
			});
	}
};

module.exports = Team;
