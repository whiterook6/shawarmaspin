/**
 * Test dependencies.
 */
var io = require('socket.io-client');
var Team = require('../lib/team.js');
var assert = require('assert');

var socket_config = {
	url: 'http://localhost:8080',
	options: {
		transports: ['websocket'],
		'force new connection': true
	}
};

/**
 * Tests
 */
describe('User Module', function() {
	describe('set initials', function() {
		it('should response with new initials', function(done) {
			var client = io.connect(socket_config.url, socket_config.options);
			client.on('user.renamed', function(data) {
				assert.equal(data, 'BOB');
				done();
			});
			client.on('user.created', function() {
				client.emit('set_initials', 'bob');
			});
		});
	});
});
