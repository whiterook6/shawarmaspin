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
describe('Team Module', function() {
	describe('set team', function() {
		it('should response with new team name', function(done) {
			var client = io.connect(socket_config.url, socket_config.options);
			client.on('team.joined', function(data) {
				assert.equal(data, 'BOB');
				done();
			});
			client.on('connect', function() {
				client.emit('set_team', 'bob');
			});
		});
	});
});
