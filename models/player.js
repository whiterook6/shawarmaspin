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
			type: Sequelize.VIRTUAL,
			validate: {
				isArray: true
			}
		},
		spm: {
			type: Sequelize.VIRTUAL
		},
		socket: {
			type: Sequelize.VIRTUAL
		}
	}, {
		tableName: 'players',
		timestamps: false,
		instanceMethods: {
			ping: function() {
				this.updateEffects();
				this.applyEffects();
			},
			updateEffects: function() {
				var activeEffects = [];
				for(var i = this.effects.legnth; i >= 0; i--) {
					var effect = this.effects[i];
					if (!effect.expired()){
						activeEffects.push(effect);
					}
				}

				this.effects = activeEffects;
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
