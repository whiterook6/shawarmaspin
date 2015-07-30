var express = require('express'),
	app = express(),

	http = require('http'),
	server = http.createServer(app),
	io = require('socket.io').listen(server);

app.use(express.static(__dirname + '/public'));

// Render and send the main page
server.listen(80);
console.log("Shawarmaspin Webserver running.");

function now(){
	return (new Date() / 1000.0);
}

// Handle the socket.io connections
io.sockets.on('connection', function (socket) {
	socket.start_time = now();
	console.log('Connection at '+socket.start_time);

	socket.on('setInitials', function(data){
		socket.initials = data.trim().toUpperCase().substring(0, 3);
		console.log('initials set to '+socket.initials);

		if (socket.interval){
			clearInterval(socket.interval);
		}

		socket.interval = setInterval(function(){
			var elapsed_time = now() - socket.start_time,
				score = elapsed_time / 60.0;

			socket.send(score.toFixed(3));
		}, 5000);
	});

	socket.on('disconnect', function(){
		if (socket.initials){
			console.log('disconnect from '+socket.initials);
		} else {
			console.log('disconnect without initals');
		}
		
		clearInterval(socket.interval);
	});
});