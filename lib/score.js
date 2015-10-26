Score = {
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

			Socket.io.sockets.emit("team_high_scores", ordered_scores);
		});
	}
};

module.exports = Score;
