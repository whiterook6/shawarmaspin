'use strict';

module.exports = {
	up: function (migration, DataTypes) {
		migration.addColumn(
			'players',
			'score_seconds',
			{
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: 0
			}
		);
	},

	down: function (migration, DataTypes) {
		migration.dropColumn(
			'players',
			'score_seconds'
		);
	}
};
