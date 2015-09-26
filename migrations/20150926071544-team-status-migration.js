'use strict';

module.exports = {
	up: function (migration, DataTypes) {
		/*
			Add altering commands here.
			Return a promise to correctly handle asynchronicity.
		*/

		migration.createTable('team_statuses', {
			id: {
				type: DataTypes.INTEGER.UNSIGNED,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false
			},
			team: {
				type: DataTypes.CHAR,
				length: 3,
				allowNull: false
			},
			status: {
				type: DataTypes.CHAR,
				length: 15,
				allowNull: false
			},
			bought_by: {
				type: DataTypes.INTEGER.UNSIGNED,
				allowNull: false,
				references: 'players',
				referencesKey: 'id',
				onUpdate: 'CASCADE',
				onDelete: 'CASCADE'
			},
			expires_at: {
				type: DataTypes.DATE,
				allowNull: false
			},
			strength: {
				type: DataTypes.FLOAT.UNSIGNED,
				allowNull: false,
			}
		});

		migration.addIndex('team_statuses',
			['team', 'status', 'expires_at', 'strength'],
			{
				indexName: 'team_status_expires_at_strength'
			});
	},

	down: function (migration, DataTypes) {
		/*
			Add reverting commands here.
			Return a promise to correctly handle asynchronicity.
		*/
		migration.dropTable('team_statuses');
	}
};
