var Team = {
	enable: function(player) {
		Logger.debug('Team.enable');

		player.socket.on('set_team', function(data){
			// if player belongs to a team already, we leave no matter what
			if (player.team) {
				Team.leave(player);
				socket.leave(player.team);
			}

			if (!data){
				return;
			}

			var new_team = data.trim().toUpperCase().substring(0, 3);
			if (new_team == player.team){
				return;
			}

			Team.join(player, new_team);
			player.socket.emit('team.joined', player.team);
		});
	},

	/**
	 * Join given team name
	 */
	join: function(player, team_name) {
		Logger.debug('Team.join');
		player.update({team: team_name});
		player.socket.join(player.team);
		return player.team;
	},

	/**
	 * Leaves current team
	 */
	leave: function(player) {
		Logger.debug('Team.leave');
		player.update({team: null});
		return player.team;
	}
};

module.exports = Team;
