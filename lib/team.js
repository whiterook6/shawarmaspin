var Team = {
	enable: function(player) {
		Logger.debug('Team.enable');

		player.socket.on('set_team', function(data){
			// if player belongs to a team already, we leave no matter what
			if (player.team) {
				Team.leave(player);
				player.socket.leave(player.team);
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
	},

	/**
	 * Sends the list of who's online for each team.
	 */
	send_team_online: function(){
		Logger.debug("Team.send_team_online");
		var online_by_team = {}, team;

		for (var i = Game.players.length - 1; i >= 0; i--) {
			var player = Game.players[i];
			team = player.team;

			if (!team){
				continue;
			}

			var datum = {
				initials: player.initials,
				score_seconds: player.score,
				spm: player.spm
			};

			if (online_by_team.hasOwnProperty(team)){
				online_by_team[team].push(datum);
			} else {
				online_by_team[team] = [datum];
			}
		}

		for (team in online_by_team){
			if (online_by_team.hasOwnProperty(team)){
				Socket.io.to(team).emit('team_online', online_by_team[team]);
			}
		}
	}
};

module.exports = Team;
