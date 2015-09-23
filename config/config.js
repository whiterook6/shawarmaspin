var env = process.env.NODE_ENV || 'development';

var Config = {};
switch(env) {
	case 'development':
		Config = require('./config.development.json');
		break;
	case 'test':
		Config = require('./config.test.json');
		break;
	case 'production':
		Config = require('./config.production.json');
		break;
}

Config.database = require('./database.json')[env];

module.exports = Config;
