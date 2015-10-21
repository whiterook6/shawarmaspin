var Socket = {
	io: null,

	// connect new socket
	connect: function(socket){
		Logger.debug('Socket.connect');

		if (!socket.request.connection.remoteAddress){
			Logger.warning('Socket.connect: No Remote Address.');
			socket.disconnect();
			return;
		}
		
		var ip = socket.request.connection.remoteAddress,
			initials = 'UNK';

		DB.pool.getConnection(function(error, connection){
			if (error){
				Logger.error('Socket.connect: Cannot get connection: ' +error);
				socket.emit('error', 'Cannot get connection');
				socket.disconnect();
				return;
			}

			var query = connection.query("INSERT INTO `players` (`ip`, `initials`, `team`, `connected_at`) VALUES (INET_ATON(?), ?, null, NOW())", [ip, initials], function(error, result){
				connection.release();

				if (error){
					Logger.error("Socket.connect: "+error);
					socket.emit('error', 'ERROR creating player: Query error.');
					socket.disconnect();
					return;
				}

				Logger.debug('Player inserts with id: '+result.insertId);

				Game.add_player(socket, result.insertId);
				socket.on('disconnect', function(){
					Socket.disconnect(socket);
				});
			});
		});
	},

	disconnect: function(socket){
		Logger.debug("Socket.disconnect");
		Game.remove_player(socket);
	},

	// Socket.each(function(socket){
	//	// do stuff with this socket.
	// });
	each: function(callback){
		if (typeof callback !== 'function'){
			return;
		}

		// '/' indicates the default namespace. We don't use different namespaces, so this is okay.
		clients = this.io.of('/').connected;

		for (var id in clients){
			if (clients.hasOwnProperty(id)){
				var socket = clients[id];
				callback(socket);
			}
		}
	},

	// Socket.team('TIM').each(function(socket){
	//	// do stuff with each socket that is in the TIM room.
	// });
	team: function(team){
		return {
			each: function(callback){
				if (typeof callback !== 'function'){
					return;
				}

				// '/' indicates the default namespace. We don't use different namespaces, so this is okay.
				clients = Socket.io.of('/').connected;

				for (var id in clients){
					if (clients.hasOwnProperty(id)){
						var socket = clients[id];

						var index = socket.rooms.indexOf(team);
						if(index !== -1) {
							callback(socket);
						}
					}
				}
			}
		};
	}
};

module.exports = Socket;
