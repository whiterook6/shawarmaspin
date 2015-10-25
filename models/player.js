module.exports = function(sequelize, Sequelize) {
	return sequelize.define('Player', {
		/* attributes */
		ip: {
			type: Sequelize.INTEGER.UNSIGNED,
			allowNull: false
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
				this.setDataValue('team', value.trim().toUpperCase().substring(0, 3));
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

		effects: {
			type: Sequelize.VIRTUAL,
			validate: {
				isArray: true
			}
		},
		spm: {
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
			}
		}
	});
};
