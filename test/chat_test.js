/**
 * Test dependencies.
 */
require('./index.js')();
var Chat = require('../lib/chat.js');

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
describe('Chat Module', function() {
	describe('messaging', function() {
		it('send global message to the chatroom', function(done) {
			var client = io.connect(socket_config.url, socket_config.options);
			var message = {
				from: {
					initials: 'TST'
				},
				text: 'Hello'
			};

			client.on('message.global', function(data) {
				assert.equal(data.from.initials, message.from.initials);
				assert.equal(data.from.text, message.from.text);
				client.disconnect();
				done();
			});

			client.on('connect', function() {
				client.emit('set_initials', 'TST');
				client.emit('message.global', message);
			});
		});

		it('send team message to the right team chatroom', function(done) {
			var client = io.connect(socket_config.url, socket_config.options);
			var message = {
				from: {
					initials: 'unk',
					team: 'BOB'
				},
				text: 'Hello'
			};

			client.on('message.team', function(data) {
				assert.equal(data.from.initials, message.from.initials);
				assert.equal(data.from.text, message.from.text);
				client.disconnect();
				done();
			});

			client.on('connect', function() {
				client.on('team.joined', function() {
					client.emit('message.team', message);
				});
				client.emit('set_team', 'BOB');
			});
		});
	});
});
