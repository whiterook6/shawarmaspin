Game = {
	players: [],
	tick_interval_seconds: 5,

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

	add_player: function(socket, player_id){
		Logger.debug('Game.create_player');
		Game.players.push(new PlayerController(socket, player_id));
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
	},
};

module.exports = Game;
