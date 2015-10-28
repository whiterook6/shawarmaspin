var inet = require('inet');

module.exports = function(sequelize, Sequelize) {
	return sequelize.define('Player', {
		/* attributes */
		ip: {
			type: Sequelize.INTEGER.UNSIGNED,
			allowNull: false,
			get: function(value) {
				var ip = this.getDataValue('ip');
				return inet.ntoa(ip);
			},
			set: function(ip) {
				this.setDataValue('ip', inet.aton(ip));
			}
		},

		initials: {
			type: Sequelize.CHAR,
			allowNull: false,
			validate: {
				len: 3
			},
			set: function(value) {
				this.setDataValue('initials', value.trim().toUpperCase().substring(0, 3));
			}
		},

		team: {
			type: Sequelize.CHAR,
			validate: {
				len: 3
			},
			set: function(value) {
				if (value) {
					this.setDataValue('team', value.trim().toUpperCase().substring(0, 3));
				} else {
					this.setDataValue('team', null);
				}
			}
		},

		score: {
			type: Sequelize.FLOAT
		},

		connected_at: {
			type: Sequelize.DATE,
			allowNull: false,
			validate: {
				isDate: true
			}
		},

		disconnected_at: {
			type: Sequelize.DATE,
			allowNull: true,
			validate: {
				isDate: true
			}
		},

		/**
		 * Virtual fields are fields that do not map to the DB
		 */
		effects: {
			type: new Sequelize.VIRTUAL(Sequelize.ARRAY),
			validate: {
				isArray: true
			}
		},
		spm: {
			type: Sequelize.VIRTUAL
		},
		socket: {
			type: Sequelize.VIRTUAL
		},
		last_tick: {
			type: Sequelize.VIRTUAL
		}
	},

	{
		tableName: 'players',
		timestamps: false,

		instanceMethods: {
			// update the player: calculate their attacks, update score based on tick length, and
			// update the client's score.
			tick: function(now) {
				if (!this.last_tick){
					this.last_tick = now;
					return;
				}

				this.last_tick = now;
				var delay_seconds = now - this.last_tick;
				this.score += delay_seconds * this.spm;

				this.updateEffects();
				this.applyEffects();
				this.send_score();
			},

			// Takes an attack. If it's not for this team, brush it off. Otherwise update your score
			// speed.
			defend: function(effect){
				Logger.debug('Player.defend');
				if (effect.team !== this.team || effect.expired()){
					return;
				}

				this.effects.push(effect);
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

			/**
			 * goes through all effects and attacks applied to this player and calculates an updated
			 * score speed (aka spins per minute: a value of 1 mean 1 spin per minute. Less means
			 * slower.)
			 */
			updateEffects: function() {
				if (this.effects.length > 0) {
					var activeEffects = [];
					for(var i = this.effects.length; i >= 0; i--) {
						var effect = this.effects[i];
						if (!effect.expired()){
							activeEffects.push(effect);
						}
					}

					this.effects = activeEffects;
				}
			},

			applyEffects: function() {
				if (!this.effects.length) {
					this.spm = 1;
				}
			},

			/**
			 * since we're still tracking the score in the player controller, we
			 * need to pass that into the model for now.
			 */
			disconnect: function(score) {
				return this.update({
					disconnected_at: new Date(),
					score: score
				});
			}
		}
	});
};
