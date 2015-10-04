var Socket = {
	// connect new socket
	connect: function(socket){
		Logger.message('Connecting socket');

		if (!socket.request.connection.remoteAddress){
			socket.disconnect();
			return;
		}
		
		socket.start_time = Timer.now();
		socket.initials = 'unk';
		// reconnect(socket); // will create player if it doesn't work.
		Socket.set_update_player_interval(socket);

		// enable player
		Player.enable(socket);
		Team.enable(socket);

		// enable chat
		Chat.enable(socket);

		socket.on('disconnect', function(){
			Socket.disconnect(socket);
		});
	},

	disconnect: function(socket) {
		if (socket.update_player_interval){
			clearInterval(socket.update_player_interval);
		}
		Logger.message('Player '+socket.initials+' disconnecting.');

		socket.disconnect();
	},

	send_score: function(socket) {
		var score_seconds = Timer.now() - socket.start_time,
			score_minutes = score_seconds / 60.0;

		socket.emit('score_minutes', score_minutes.toFixed(3));
	},

	set_update_player_interval: function(socket) {
		if (socket.update_player_interval){
			clearInterval(socket.update_player_interval);
		}

		Logger.message('Setting update player interval');

		socket.update_player_interval = setInterval(function(){
			Player.increment_score(socket, 5);
			Socket.send_score(socket);
			Team.send_team_online(socket);
		}, 5000);

	}
};

module.exports = Socket;
