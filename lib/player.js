var Player = require('../models').Player;

var PlayerController = function(socket, player_id){
	Logger.debug('Player.constructor');
	this.socket = socket;
	this.player_id = player_id;

	this.score = {
		seconds: 0.0,
		speed: 1.0
	};

	this.last_tick = Timer.now();
	this.attacks = [];
	this.initials = 'UNK';
	this.team = null;


	var player = this;
	this.socket.on('set_initials', function(data){
		player.set_initials(data);
		this.emit('intials_set');
	});
};

PlayerController.prototype = {
	constructor: PlayerController,
	player: null,

	// goes through all effects and attacks applied to this player and calculates an updated
	// score speed (aka spins per minute: a value of 1 mean 1 spin per minute. Less means
	// slower.)
	update_attacks: function(){
		Logger.debug('Player.update_attacks');
		if (this.player) {
			this.player.ping();

			// to maintain compatibility for now.
			this.attacks = this.player.effects;
			this.score.speed = this.player.spm;
		}
	},

	disconnect: function(){
		Logger.debug("Player.disconnect");
		return PlayerController.player.disconnect(this.score.seconds);
	},

	// Takes an attack. If it's not for this team, brush it off. Otherwise update your score
	// speed.
	defend: function(attack){
		Logger.debug('Player.defend');
		if (attack.team !== this.team || attack.expired()){
			return;
		}

		this.attacks.push(attack);
		this.tick(Timer.now());
	},

	// Immediate deduction to the player's score. a value of 60 = one spin. Highers means
	// more score subtracted.
	penalize: function(penalty_seconds){
		Logger.debug('Player.penalize');
		this.score.seconds = Math.max(0, this.score.seconds - penalty_seconds);
		this.send_score();
	},

	// update the client about their score. See above for the score format
	send_score: function(){
		Logger.debug('Player.send_score');
		this.socket.emit('score', this.score);
	},

	// update the player: calculate their attacks, update score based on tick length, and
	// update the client's score.
	tick: function(now){
		Logger.debug('Player.tick');
		if (!this.last_tick){
			this.last_tick = now;
			return;
		}

		var delay_seconds = now - this.last_tick;
		this.last_tick = now;

		this.update_attacks();
		this.score.seconds += delay_seconds * this.score.speed;
		this.send_score();
	},

	set_initials: function(data){
		Logger.debug('Player.set_initials');
		if (!data){
			Logger.warning('Player attempting to set falsey initials');
			return;
		}

		return Player.findById(this.player_id).then(function(player) {
			player.update({initials: data}).then(function(player) {
				PlayerController.initials = player.initials;
				PlayerController.player = player;
				Logger.debug("Setting Player Initials");
			});
		});
	}
};

module.exports = PlayerController;
