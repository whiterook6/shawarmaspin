var Socket = {
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

	}
};

module.exports = Socket;
