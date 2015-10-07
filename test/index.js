require('../server.js');

module.exports = function() {
	this.io_client = require('socket.io-client');
	this.assert = require('assert');
};
