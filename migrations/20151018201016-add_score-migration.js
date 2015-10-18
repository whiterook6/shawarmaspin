'use strict';

module.exports = {
  up: function (migration, DataTypes) {
    migration.addColumn('players', 'score', {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0
    });
  },

  down: function (migration, DataTypes) {
    migration.removeColumn('players', 'score');
  }
};
