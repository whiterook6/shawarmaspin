Score = {
	/**
	 * Sends the highest scoring teams, now and extinct, to all players.
	 */
	send_team_high_scores: function(){
		Logger.debug('Score.send_team_high_scores');
		var team_scores = {};
		function add_to_team_scores(team_scores, team, score, speed){
			if (team_scores.hasOwnProperty(team)){
				team_scores[team].score += score;
				team_scores[team].speed += speed;
			} else {
				team_scores[team] = {
					score: score,
					speed: speed
				};
			}

			return team_scores;
		}

		for (var i = Game.players.length - 1; i >= 0; i--) {
			var player = Game.players[i],
				team = player.team,
				score,
				speed;

			if (!team){
				continue;
			}

			score = player.score.seconds;
			speed = player.score.speed;

			add_to_team_scores(team_scores, team, score, speed);
		}

		DB.query("SELECT `team`, SUM(`score`) as `score` FROM `players` WHERE `disconnected_at` IS NOT NULL AND `team` IS NOT NULL GROUP BY `team`", [], "Getting team scores", function(results){
			var team, i, score, ordered_scores;
			for (i = results.length - 1; i >= 0; i--) {
				team = results[i].team;
				score = results[i].score;
				add_to_team_scores(team_scores, team, score, 0);
			}

			ordered_scores = [];
			for (team in team_scores) {
				if (team_scores.hasOwnProperty(team)){
					ordered_scores.push({
						team: team,
						score_seconds: team_scores[team].score,
						spm: team_scores[team].speed
					});
				}
			}

			ordered_scores.sort(function(a, b){
				return b.score_seconds - a.score_seconds; // note that we are sorting in a descending order.
			});

			Socket.io.sockets.emit("team_high_scores", ordered_scores.slice(0, 5));
		});
	},

	/**
	 * Sends the top spinners to all players.
	 */
	send_top_spinners: function(){
		Logger.debug("Score.send_top_spinners");
		function add_top_spinner(scores, initials, score_seconds, spm){
			scores.push({
				initials: initials,
				score_seconds: score_seconds,
				spm: spm,
			});
		}

		var top_spinners = [];
		for (var i = Game.players.length - 1; i >= 0; i--) {
			var player = Game.players[i];
			add_top_spinner(top_spinners, player.initials, player.score.seconds, player.score.speed);
		}

		// note that since we're only gonna send down the top 5, no need to get more than 5 here.
		DB.query("SELECT `score`, `initials` FROM `players` WHERE disconnected_at IS NOT NULL ORDER BY `score` DESC LIMIT 5", [], "getting high spinner scores", function(results){
			for (var i = results.length - 1; i >= 0; i--) {
				var player = results[i];
				add_top_spinner(top_spinners, player.initials, player.score, 0);
			}
			top_spinners.sort(function(a, b){
				return b.score_seconds - a.score_seconds;
			});

			Socket.io.sockets.emit("high_scores", top_spinners.slice(0, 5));
		});
	}
};

module.exports = Score;
