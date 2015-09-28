var Chat = {

	// takes in a socket.io socket object. Enables chat protocol on this socket: message.global, message.team
	enable: function(socket){
		if (!socket || !socket.on){
			return;
		}

		// Sends a message to the global chat, or to a team chat from the outside (see example data)
		// data: {
		// 	message: 'You guys suck!'
		// }
		// or
		// data: {
		// 	message: '#BOB You guys suck'
		// }
		socket.on('message.global', function(data){
			if (!data || !data.text || !socket.initials){ // can't send nothing or send without initials.
				return;
			}

			if ((Timer.now() - socket.last_message) < 10){
				return;
			}


			var message_re = /#([a-zA-Z0-9]{3}) (.+)/, // match #BOB you guys suck -> match[0]='BOB', match[1]='you guys suck'
				match,
				team,
				message,
				packet = {
					from: {
						initials: socket.initials //,
						// team: socket.team
					} //,
					// text: 'You guys suck'
				};

			if (socket.team){
				packet.from.team = socket.team;
			}

			if ((match = message_re.exec(data.text)) !== null){

				// send message to desired team
				team = match[1].toUpperCase();
				message = match[2];

				packet.text = message;
				socket.broadcast.to(team).emit('message.team', packet);

				// inform global chat of trash talking
				socket.broadcast.emit('message.global', {
					from: {
						initials: socket.initials
					},
					text: socket.initials+" trash talked #"+team
				});

			} else { // if we don't see #BOB at the start

				// send message to global chat
				packet.text = data.text;
				socket.broadcast.emit('message.global', packet);
			}

			socket.last_message = Timer.now();
		});

		// message to own team
		// data: {
		// 	text: 'Yeah guys!'
		// }
		socket.on('message.team', function(data){
			if (!data || !data.text || !socket.initials || !socket.team){ // can't send nothing or send without initials.
				return;
			}

			var packet = {
				from: {
					initials: socket.initials
				},
				text: data.text
			};

			socket.broadcast.to(socket.team).emit('message.team', packet);
		});
	}
};

module.exports = Chat;
