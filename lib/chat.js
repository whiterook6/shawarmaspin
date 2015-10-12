var Chat = {

	send_global: function(from_initials, from_team, text){
		Logger.debug('Chat.send_global');
		if (!from_initials){
			Logger.warning('Sending message without from_initials');
			return;
		}

		if (!text){
			Logger.warning('Sending message without text');
			return;

		}
		
		var packet = {
			from: {
				initials: from_initials
			},
			text: text
		};
		if (from_team){
			packet.from.team = from_team;
		}

		Socket.io.sockets.emit('message.global', packet);
	},

	send_team: function(from_initials, from_team, to_team, text){
		Logger.debug('Chat.send_team');
		if (!from_initials){
			Logger.warning('Sending message without from_initials');
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
				initials: from_initials
			},
			text: text
		};
		if (from_team){
			packet.from.team = from_team;
		}

		socket.broadcast.to(team).emit('message.team', packet);
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

			if (!data || !data.text || !socket.initials){ // can't send nothing or send without initials.
				return;
			}

			if ((Timer.now() - socket.last_message) < 10){
				return;
			}

			var message_re = /#([a-zA-Z0-9]{3}) (.+)/, // match #BOB you guys suck -> match[1]='BOB', match[2]='you guys suck'
				match = message_re.exec(data.text);

			if (match !== null) {
				
				// send message to desired team
				var to_team = match[1].toUpperCase(),
					message = match[2];

				Chat.send_team(socket.initials, socket.team, to_team, message);

				// send announcement to global
				Chat.send_from_system(socket.initials+" trash talked #"+team);

			} else {
				
				// send message to global
				Chat.send_global(socket.initials, socket.team, data.text);
			}

			socket.last_message = Timer.now();
		});

		// message to own team
		// data: {
		//	text: 'Yeah guys!'
		// }
		socket.on('message.team', function(data){
			Logger.debug('Event: message.team');
			if (!data || !data.text || !socket.initials || !socket.team){ // can't send nothing nor send without initials.
				return;
			}

			// send to the same team as the 'from_team'
			Chat.send_team(socket.initials, socket.team, socket.team, data.text);
		});

		socket.emit('chat.enabled');
	}
};

module.exports = Chat;
