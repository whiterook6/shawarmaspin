'use strict';

module.exports = {
	up: function (migration, DataTypes) {
		/*
			Add altering commands here.
			Return a promise to correctly handle asynchronicity.

			Example:
			return queryInterface.createTable('users', { id: Sequelize.INTEGER });
		*/
		migration.createTable('players',
			{
				id: {
					type: DataTypes.INTEGER.UNSIGNED,
					primaryKey: true,
					autoIncrement: true,
					allowNull: false
				},
				ip: {
					type: DataTypes.INTEGER.UNSIGNED,
					allowNull: false
				},
				initials: {
					type: DataTypes.CHAR,
					allowNull: false,
					length: 3
				},
				team: {
					type: DataTypes.CHAR,
					length: 3
				},
				connected_at: {
					type: DataTypes.DATE,
					allowNull: false
				},
				last_ping: {
					type: DataTypes.DATE,
					allowNull: false
				}
			}
		);

		migration.addIndex('players',
			['initials', 'team', 'connected_at', 'last_ping'],
			{
				indexName: 'intial_team_connection_index'
			}
		);
	},

	down: function (migration, DataTypes) {
		/*
			Add reverting commands here.
			Return a promise to correctly handle asynchronicity.

			Example:
			return queryInterface.dropTable('users');
		*/
		migration.dropTable('players');
	}
};
