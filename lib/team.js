var Team = {
	enable: function(player) {
		Logger.debug('Team.enable');

		player.socket.on('set_team', function(data){
			if (!data){
				if (player.team){
					Team.leave(player);
				}

				return;
			}
			var socket = player.socket;

			var new_team = data.trim().toUpperCase().substring(0, 3);
			if (new_team == player.team){
				return;
			}

			if (player.team){
				socket.leave(player.team);
			}
			
			Team.join(player, new_team);
			socket.emit('team.joined', player.team);
		});
	},

	/**
	 * Join given team name
	 */
	join: function(player, team_name) {
		Logger.debug('Team.join');
		var socket = player.socket;
		player.team = team_name;

		socket.join(player.team);
		Team.update_team_in_db(player);
		return player.team;
	},

	/**
	 * Leaves current team
	 */
	leave: function(player) {
		Logger.debug('Team.leave');
		player.team = null;

		Team.update_team_in_db(player);
		return player.team;
	},

	/**
	 * Saves the current player's team in the DB.
	 */
	update_team_in_db: function(player) {
		Logger.debug('Team.update_team');
		if (!player || !player.player_id){
			Logger.error('updating team: player.player_id is falsey.');
			return;
		}

		DB.query("UPDATE `players` SET `team` = ? WHERE `id` = ?",
			[player.team, player.player_id],
			"Updating player team",
			function(results){
				if (results.changedRows === 0){
					Logger.warning("Warning updating player team: No changed rows.");
				}
			});
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
				score_seconds: player.score.seconds,
				spm: player.score.speed
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
