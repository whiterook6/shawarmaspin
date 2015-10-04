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
describe('User Module', function() {
	describe('set initials', function() {
		it('should response with new initials', function(done) {
			var client = io.connect(socket_config.url, socket_config.options);

			client.on('player.renamed', function(data) {
				assert.equal(data, 'BOB');
				client.disconnect();
				done();
			});

			client.on('connect', function() {
				client.emit('set_initials', 'bob');
			});
		});
	});
});
