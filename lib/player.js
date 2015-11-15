var Player = require('../models').Player;

PlayerController = {
	enable: function(player) {
		this.player = player;
		player.effects = [];
		player.spm = 1;
		player.score = 0;
		player.tick(Timer.now());
		player.socket.on('set_initials', function(data){
			PlayerController.set_initials(player, data);
			this.emit('intials_set');
		});
		player.updateScoreInDB = setInterval(player.update_score_in_db, 60000);
	},

	disconnect: function(){
		Logger.debug("Player.disconnect");
		if (player.update_score_interval){
			clearInterval(player.update_score_interval);
		}
		
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

		var online = [];
		for (var i = Game.players.length - 1; i >= 0; i--) {
			online.push({
				initials: Game.players[i].initials
			});
		}

		Socket.io.sockets.emit("online", online);
	}
};

module.exports = PlayerController;
