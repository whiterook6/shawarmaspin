Game = {
	players: [],
	tick_interval_seconds: 10,

	start: function(){
		Logger.debug('Game.start');
		Game.tick_interval = setInterval(Game.tick, Game.tick_interval_seconds * 1000); // delay in milliseconds
	},

	stop: function(){
		Logger.debug('Game.stop');
		if (Game.tick_interval){
			stopInterval(Game.tick_interval);
		}
	},

	add_player: function(player){
		Logger.debug('Game.create_player');
		Game.players.push(player);
	},

	remove_player: function(socket){
		Logger.debug('Game.remove_player');
		for (var i = Game.players.length - 1; i >= 0; i--) {
			if (Game.players[i].socket == socket){
				var player = Game.players.splice(i, 1)[0];
				player.disconnect();
				break;
			}
		}
	},

	tick: function(){
		Logger.debug('Game.tick');
		var now = Timer.now();

		for (var i = Game.players.length - 1; i >= 0; i--) {
			Game.players[i].tick(now);
		}

		Score.send_team_high_scores();
		Score.send_top_spinners();
		Team.send_team_online();
		PlayerController.send_online();
	},
};

module.exports = Game;
