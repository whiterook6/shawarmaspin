var Player = require('../models').Player;

PlayerController = {
	enable: function(player) {
		this.player = player;
		player.effects = [];
		player.spm = 1;
		player.tick(Timer.now());
		player.socket.on('set_initials', function(data){
			PlayerController.set_initials(player, data);
			this.emit('intials_set');
		});
	},

	disconnect: function(){
		Logger.debug("Player.disconnect");
		return PlayerController.player.disconnect(this.score.seconds);
	},


	set_initials: function(player, data){
		Logger.debug('Player.set_initials');
		if (!data){
			Logger.warning('Player attempting to set falsey initials');
			return;
		}

		return player.update({initials: data});
	}
};

module.exports = PlayerController;
