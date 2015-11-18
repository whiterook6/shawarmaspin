var Player = require('../models').Player;

PlayerController = {
	enable: function(player) {
		PlayerController.player = player;
		player.update_score_interval = setInterval(function(){
			player.update({
				score: player.score
			});
		}, 10000);
		player.effects = [];
		player.spm = 1;
		player.score = 0;
		player.tick(Timer.now());
		player.socket.on('set_initials', function(data){
			PlayerController.set_initials(player, data);
			this.emit('intials_set');
		});
	},

	disconnect: function(){
		Logger.debug("Player.disconnect");
		clearInterval(PlayerController.player.update_score_interval);
		return PlayerController.player.disconnect(this.score.seconds);
	},


	set_initials: function(player, data){
		return player.update({initials: data});
	},

	/**
	 * Sends the who's online board to all players.
	 */
	send_online: function(){
		Logger.debug("Player.send_online");

		var online = {
			count: Game.players.length,
			members: []
		};
		for (var i = Math.max(0, Game.players.length - 10); i < Game.players.length; i++) {
			var _p = Game.players[i];
			online.members.push({
				initials: _p.initials,
				team: _p.team,
				score_seconds: parseFloat(_p.score.toFixed(3)),
				spm: _p.spm
			});
		}

		Socket.io.sockets.emit("online", online);
	}
};

module.exports = PlayerController;
