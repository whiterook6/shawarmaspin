var Chat = {

	// takes in a socket.io socket object. Enables chat protocol on this socket: message.global, message.team
	enable_chat: function(socket){

		// Sends a message to the global chat, or to a team chat from the outside (see example data)
		// data: {
		// 	message: 'You guys suck!'
		// }
		// or
		// data: {
		// 	message: '#BOB You guys suck'
		// }
		socket.on('message.global', function(data){
			if (!data || !data.message || !socket.initials){ // can't send nothing or send without initials.
				return;
			}

			var message_re = /#([a-zA-Z]{3}) ?(.+)/, // match #BOB you guys suck -> match[0]='BOB', match[1]='you guys suck'
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

			if ((match = message_re.exec(data.message)) !== null){

				// send message to desired team
				team = match[0];
				message = match[1];

				packet.text = message;
				socket.broadcast.to(team).emit('message.team', message);

				// inform global chat of trash talking
				socket.broadcast.emit('message.trash', {
					from: {
						initials: socket.initials
					},
					to: {
						team: team
					}
				});

			} else {

				// send message to global chat
				packet.text = data.message;
				socket.broadcast.emit('message.global', packet);
			}
		});

		// message to own team
		// data: {
		// 	text: 'Yeah guys!'
		// }
		socket.on('message.team', function(data){
			if (!data || !data.message || !socket.initials || !socket.team){ // can't send nothing or send without initials.
				return;
			}

			var packet = {
				from: {
					initials: socket.initials
				},
				text: data.message
			};

			socket.broadcast.to(socket.team).emit('message.team', packet);
		});
	}
};

module.exports = Chat;
