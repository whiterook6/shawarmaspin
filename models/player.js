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

		connected_at: {
			type: Sequelize.DATE,
			allowNull: false,
			validate: {
				isDate: true
			}
		},

		last_ping: {
			type: Sequelize.DATE,
			allowNull: false,
			validate: {
				isDate: true
			}
		}
	}, {
		tableName: 'players',
		timestamps: false,
		instanceMethods: {
		}
	});
};