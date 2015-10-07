/**
 * Test dependencies.
 */
require('./index.js')();

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
		it('should response with a new team name', function(done) {
			var client = io_client.connect(socket_config.url, socket_config.options);

			client.on('team.joined', function(data) {
				assert.equal(data, 'BOB');
				client.disconnect();
				done();
			});

			client.on('connect', function() {
				client.emit('set_team', 'bob');
			});
		});
	});
});
