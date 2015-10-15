var Chat = {

	send_global: function(player, text){
		Logger.debug('Chat.send_global');

		if (!player.initials){
			Logger.warning('Sending message without from_initials');
			return;
		}

		if (!text){
			Logger.warning('Sending message without text');
			return;

		}
		
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
		if (!player.initials){
			Logger.warning('Sending a team message without initials');
			return;
		}

		if (!player.team){
			Logger.warning('Sending a team message without a team');
			return;
		}

		if (!to_team){
			Logger.warning('Sending message without to_team');
			return;
		}

		if (!text){
			Logger.warning('Sending message without text');
			return;
		}

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
		}

		var packet = {
			text: text
		};

		Socket.io.sockets.emit('message.system', packet);
	},

	// takes in a socket.io socket object. Enables chat protocol on this socket: message.global, message.team
	enable: function(socket){
		Logger.debug('Chat.enable');
		if (!socket){
			Logger.warning('Chat.enable without a socket');
			return;
		}

		// Event: incoming message to global. Might be directed at another team.
		// Certainly not a team message (to own team)
		socket.on('message.global', function(data){
			Logger.debug('Event: message.global');

			if (!data || !data.text || !socket.player || !socket.player.initials){ // can't send nothing or send without initials.
				return;
			}

			var player = socket.player;

			if (!player.last_message){
				player.last_message = Timer.now();
			} else if ((Timer.now() - socket.last_message) < 10){
				Logger.warning('Flood detection');
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
				Chat.send_from_system(players.initials+" trash talked #"+to_team);

			} else {
				
				// send message to global
				Chat.send_global(player, data.text);
			}

			socket.last_message = Timer.now();
		});

		// message to own team
		// data: {
		//	text: 'Yeah guys!'
		// }
		socket.on('message.team', function(data){
			Logger.debug('Event: message.team');
			if (!data || !data.text || !socket.players.initials || !socket.players.team){ // can't send nothing nor send without initials.
				return;
			}

			// send to the same team as the 'from_team'
			Chat.send_team(socket.players.initials, socket.players.team, socket.players.team, data.text);
		});

		socket.emit('chat.enabled');
	}
};

module.exports = Chat;
