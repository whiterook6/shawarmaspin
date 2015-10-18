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

	create_player: function(socket){
		Logger.debug('Game.create_player');
		Game.players.push(new Player(socket));
	},

	remove_player: function(socket){
		Logger.debug('Game.remove_player');
		for (var i = Game.players.length - 1; i >= 0; i--) {
			if (Game.players[i].socket == socket){
				Game.players.splice(i);
				break;
			}
		}
	},

	tick: function(){
		Logger.debug('Game.tick');
		var now = Timer.now(),
			online_ids = [];

		for (var i = Game.players.length - 1; i >= 0; i--) {
			var player = Game.players[i];
			online_ids.push(player.socket.player_id);
			player.tick(now);
		}

		if (online_ids.length === 0){
			return;
		}

		// var online_id_string = "'"+online_ids.join("', '")+"'";
		// Logger.debug('ID string: '+online_id_string);
		DB.query("UPDATE `players` SET `last_ping` = NOW() WHERE `id` IN (?)",
			[online_ids],
			"Updating players last_ping"
		);
	},
};

module.exports = Game;