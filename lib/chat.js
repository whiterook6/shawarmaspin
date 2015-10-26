var Chat = {
	send_global: function(player, text){
		Logger.debug('Chat.send_global');
		var packet = {
			from: {
				initials: player.initials
			},
			text: text
		};

		if (player.team){
			packet.from.team = player.team;
		}

		player.socket.broadcast.emit('message.global', packet);
	},

	send_team: function(player, to_team, text){
		Logger.debug('Chat.send_team');

		var packet = {
			from: {
				initials: player.initials
			},
			text: text
		};
		if (player.team){
			packet.from.team = player.team;
		}

		player.socket.broadcast.to(to_team).emit('message.team', packet);
	},

	send_from_system: function(text){
		Logger.debug('Chat.send_from_system');
		if (!text){
			Logger.warning('Sending message without text');
			return;
		}

		var packet = {
			text: text
		};

		Socket.io.sockets.emit('message.system', packet);
	},

	// takes in a socket.io socket object. Enables chat protocol on this socket: message.global, message.team
	enable: function(player){
		Logger.debug('Chat.enable');
		var socket = player.socket;

		// Event: incoming message to global. Might be directed at another team.
		// Certainly not a team message (to own team)
		socket.on('message.global', function(data){
			Logger.debug('Event: message.global');

			if (!data || !data.text){ // can't send nothing without text.
				return;
			}

			if (!player.last_message){
				player.last_message = Timer.now();
			} else if ((Timer.now() - player.last_message) < 3){
				Logger.warning('Flood detection');
				socket.emit('flood.detection');
				return;
			}

			var message_re = /#([a-zA-Z0-9]{3}) (.+)/, // match #BOB you guys suck -> match[1]='BOB', match[2]='you guys suck'
				match = message_re.exec(data.text);

			if (match !== null) {

				// send message to desired team
				var to_team = match[1].toUpperCase(),
					message = match[2];

				Chat.send_team(player, to_team, message);

				// send announcement to global
				Chat.send_from_system(player.initials+" trash talked #"+to_team);

			} else {

				// send message to global
				Chat.send_global(player, data.text);
			}

			player.last_message = Timer.now();
		});

		// message to own team
		// data: {
		//	text: 'Yeah guys!'
		// }
		socket.on('message.team', function(data){
			Logger.debug('Event: message.team');

			if (!data || !data.text || !player.team){ // can't send nothing without text.
				return;
			}

			if (player.last_message && (Timer.now() - player.last_message) < 10){
				Logger.warning('Flood detection');
				socket.emit('flood.detection');
				return;
			}

			player.last_message = Timer.now();

			// send to the same team as the 'from_team'
			Chat.send_team(player, player.team, data.text);
		});

		socket.emit('chat.enabled');
	}
};

module.exports = Chat;
