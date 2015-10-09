var Socket = {
	io: null,

	// connect new socket
	connect: function(socket){
		if (!socket.request.connection.remoteAddress){
			socket.disconnect();
			return;
		}
		
		socket.start_time = Timer.now();
		socket.initials = 'unk';
		Socket.set_update_player_interval(socket);

		// enable different modules for this socket.
		Player.enable(socket);
		Team.enable(socket);
		Chat.enable(socket);

		setInterval(function(){
			Player.emit_online_players();
			Score.emit_high_scores();
			Team.emit_team_high_scores();
		}, 5000);

		socket.on('disconnect', function(){
			Socket.disconnect(socket);
		});
	},

	disconnect: function(socket) {
		if (socket.update_player_interval){
			clearInterval(socket.update_player_interval);
		}

		socket.disconnect();
	},

	send_score: function(socket) {
		var elapsed_time = Timer.now() - socket.start_time,
			score = elapsed_time / 60.0;

		socket.emit('score_minutes', score.toFixed(3));
	},

	set_update_player_interval: function(socket) {
		if (socket.update_player_interval){
			clearInterval(socket.update_player_interval);
		}

		socket.update_player_interval = setInterval(function(){
			Player.ping_player(socket);
			Socket.send_score(socket);
			Team.send_team_online(socket);
		}, 5000);
	},

	each: function(callback){
		if (typeof callback !== 'function'){
			return;
		}

		clients = this.io.of('/').connected;

		// '/' indicates the default namespace. We don't use different namespaces, so this is okay.
		for (var id in clients){
			if (clients.hasOwnProperty(id)){
				callback(clients[id]);
			}
		}
	},

	room: function(room_id){
		return {
			each: function(callback){
				if (typeof callback !== 'function'){
					return;
				}

				clients = Socket.io.of('/').connected;

				// '/' indicates the default namespace. We don't use different namespaces, so this is okay.
				for (var id in clients){
					if (clients.hasOwnProperty(id)){
						var index = clients[id].rooms.indexOf(room_id);
						if(index !== -1) {
							callback(clients[id]);
						}
					}
				}
			}
		};
	}
};

module.exports = Socket;

// Socket.each(function(socket){
// 	// do stuff with this socket.
// });

// Socket.room('TIM').each(function(socket){
// 	// do stuff with this socket that is in the TIM room.
// });