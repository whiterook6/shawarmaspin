var Socket = {
	// connect new socket
	connect: function(socket){
		debug_message('Connecting socket');
		socket.start_time = now();
		socket.initials = 'unk';
		// reconnect(socket); // will create player if it doesn't work.
		Player.create_player(socket);
		Socket.set_update_player_interval(socket);

		socket.on('set_initials', function(data){
			if (data && data != socket.initials){
				socket.initials = data.trim().toUpperCase().substring(0, 3);
				
				debug_message('Incoming initials: '+socket.initials);
				Player.update_initials(socket);
				Player.reset_score(socket);
			}
		});

		socket.on('set_team', function(data){
			if (socket.team){
				socket.leave(socket.team);
			}

			if (data){
				if (data != socket.team){
					socket.team = data.trim().toUpperCase().substring(0, 3);
					socket.join(socket.team);
					
					debug_message('Incoming team: '+socket.team);
					update_team(socket);
				}
			} else {
				socket.team = null;
				
				debug_message('Incoming team: null');
				update_team(socket);
			}
		});

		socket.on('message', function(data){
			if (socket.last_message && (now() - socket.last_message) < 10){
				return;
			}

			var message = {
				initials: socket.initials,
				message: data
			};

			if (socket.team){
				message.team = socket.team;
				socket.broadcast.to(socket.team).emit('message', message);
			} else {
				socket.broadcast.emit('message', message);
			}

			socket.last_message = now();
		});

		socket.on('disconnect', function(){
			Socket.disconnect(socket);
		});
	},

	disconnect: function(socket) {
		if (socket.update_player_interval){
			clearInterval(socket.update_player_interval);
		}
		debug_message('Player '+socket.initials+' disconnecting.');

		socket.disconnect();
	},

	send_score: function(socket) {
		var elapsed_time = now() - socket.start_time,
			score = elapsed_time / 60.0;

		socket.emit('score_minutes', score.toFixed(3));
	},

	set_update_player_interval: function(socket) {
		if (socket.update_player_interval){
			clearInterval(socket.update_player_interval);
		}

		debug_message('Setting update player interval');

		socket.update_player_interval = setInterval(function(){
			Player.ping_player(socket);
			Socket.send_score(socket);
			send_team_online(socket);
		}, 5000);

	}
};

module.exports = Socket;
