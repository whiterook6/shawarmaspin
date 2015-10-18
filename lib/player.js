var Player = function(socket, player_id){
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

	Chat.enable(this);
	Team.enable(this);
	
	var player = this;
	this.socket.on('set_initials', function(data){
		player.set_initials(data);
		this.emit('intials_set');
	});
};

Player.prototype = {
	constructor: Player,

	// goes through all effects and attacks applied to this player and calculates an updated
	// score speed (aka spins per minute: a value of 1 mean 1 spin per minute. Less means
	// slower.)
	update_attacks: function(){
		Logger.debug('Player.update_attacks');
		var current_attacks = [];
		for (var i = this.attacks.length - 1; i >= 0; i--) {
			var attack = this.attacks[i];
			if (!attack.expired()){
				current_attacks.push(attack);
			}
		}

		this.attacks = current_attacks;

		if (this.attacks.length === 0){
			this.score.speed = 1;
			return;
		}
	},

	disconnect: function(){
		Logger.debug("Player.disconnect");
		DB.query("UPDATE `players` SET `disconnected_at` = NOW(), `score` = ? WHERE `id` = ?", [this.score.seconds, this.player_id], "Setting disconnected_at time in DB for player");
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

		var new_initials = data.trim().toUpperCase().substring(0, 3);
		if (this.initials == new_initials){
			return;
		}

		this.initials = new_initials;
		DB.query("UPDATE `players` SET `initials` = ? WHERE `id` = ?", [this.initials, this.player_id], "Setting Player Initials");
	}
};

module.exports = Player;