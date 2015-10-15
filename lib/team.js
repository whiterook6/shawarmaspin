var Team = {
	enable: function(socket) {
		Logger.debug('Team.enable');

		socket.on('set_team', function(data){
			if (!data){
				if (socket.team){
					Team.leave(socket);
				}

				return;
			}

			var new_team = data.trim().toUpperCase().substring(0, 3);
			if (new_team == socket.team){
				return;
			}

			if (socket.team){
				socket.leave(socket.team);
			}
			
			Team.join(socket, new_team);
			socket.emit('team.joined', socket.team);
		});
	},

	/**
	 * Join given team name
	 */
	join: function(socket, team_name) {
		Logger.debug('Team.join');
		socket.team = team_name;
		socket.join(socket.team);
		Team.update_team(socket);
		return socket.team;
	},

	/**
	 * Leaves current team
	 */
	leave: function(socket) {
		Logger.debug('Team.leave');
		socket.team = null;
		Team.update_team(socket);
		return socket.team;
	},

	// save player team
	update_team: function(socket) {
		Logger.debug('Team.update_team');
		if (!socket || !socket.player_id){
			Logger.error('updating team: socket.player_id is falsey.');
			return;
		}

		DB.query("UPDATE `players` SET `team` = ? WHERE `id` = ?",
			[socket.team, socket.player_id],
			"Updating player team",
			function(results){
				if (results.changedRows === 0){
					Logger.warning("Warning updating player team: No changed rows.");
				}
			});
	}
};

module.exports = Team;
