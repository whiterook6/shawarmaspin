angular.module('ShawarmaSpinApp', []).controller('ShawarmaController', ['$interval', 'Socket', 'Team', 'Player', 'Chat', function($interval, Socket, Team, Player, Chat) {
	function print_score(score){
		if (score < 10){
			return score.toFixed(3);
		} else if (score < 100){
			return score.toFixed(2);
		} else if (score < 1000){
			return score.toFixed(1);
		} else {
			return Math.floor(score);
		}
	}

	var shawarma_ctrl = this;
	angular.extend(shawarma_ctrl, {
		boards: {
			online: [],
			high_scores: [],
			team_scores: [],
			team_online: []
		},

		display: {
			initials: 'unk',
			team: null,
			score: 0.0
		},

		player: {
			initials: 'unk',
			team: null,
			score_minutes: 0.0
		},

		chatrooms: {
			options: ['global', 'team'],
			view: 'global'
		},
		messages_global: [],
		messages_team: [],
		new_message: null
	});

	/* Controls */
	shawarma_ctrl.set_name = function(){
		shawarma_ctrl.player.initials = Player.set_name(shawarma_ctrl.display.initials);
		
	};
	shawarma_ctrl.reset_name = function(){
		shawarma_ctrl.display.initials = shawarma_ctrl.player.initials;
	};

	shawarma_ctrl.set_team = function(){
		if (shawarma_ctrl.display.team) {
			var result = Team.set_name(shawarma_ctrl.display.team);
			if (result) {
				shawarma_ctrl.player.team = result;
				shawarma_ctrl.messages_team = [];
			}
		}
	};
	shawarma_ctrl.reset_team = function(){
		shawarma_ctrl.display.team = shawarma_ctrl.player.team;
	};

	shawarma_ctrl.update_name = function(){
		shawarma_ctrl.set_name();
		shawarma_ctrl.set_team();
	};
	shawarma_ctrl.needs_name_updated = function(){
		return ((shawarma_ctrl.player.initials != shawarma_ctrl.display.initials) || (shawarma_ctrl.player.team != shawarma_ctrl.display.team));
	};
	shawarma_ctrl.send_message_global = function(){
		if (shawarma_ctrl.new_message_global){
			var message = Chat.build_message(shawarma_ctrl.new_message_global);
			shawarma_ctrl.messages_global.push(message);
			Chat.to_global(message);
			shawarma_ctrl.new_message_global = null;
		}
	};
	shawarma_ctrl.send_message_team = function(){
		if (shawarma_ctrl.new_message_team){
			var message = Chat.build_message(shawarma_ctrl.new_message_team);
			shawarma_ctrl.messages_team.push(message);
			Chat.to_team(message);
			shawarma_ctrl.new_message_team = null;
		}
	};

	/* Socket Events */
	Socket.io.on('connect', function(){
		shawarma_ctrl.set_name();
		shawarma_ctrl.set_team();
		shawarma_ctrl.player.score = 0.0;
		shawarma_ctrl.display.score = 0.0;
		shawarma_ctrl.connected = true;
	});

	Socket.io.on('online', function(data){
		if (!data){
			return;
		}

		shawarma_ctrl.boards.online = [];
		for (var i = 0; i < data.length; i++) {
			shawarma_ctrl.boards.online.push({
				initials: data[i].initials
			});
		}
	});

	Socket.io.on('high_scores', function(data){
		if (!data){
			return;
		}

		shawarma_ctrl.boards.high_scores = [];
		for (var i = 0; i < data.length; i++) {
			var datum = data[i];
			shawarma_ctrl.boards.high_scores.push({
				rank: i,
				initials: datum.initials,
				score_minutes: print_score(datum.score_seconds / 60.0)
			});
		}
	});

	Socket.io.on('team_high_scores', function(data){
		if (!data){
			return;
		}

		shawarma_ctrl.boards.team_scores = [];
		for (var i = 0; i < data.length; i++) {
			var datum = data[i];

			shawarma_ctrl.boards.team_scores.push({
				rank: i,
				team: datum.team,
				score_minutes: print_score(datum.score_seconds / 60.0),
				spm: datum.spm
			});
		}
	});

	Socket.io.on('team_online', function(data){
		if (!data){
			return;
		}

		shawarma_ctrl.boards.team_online = [];
		for (var i = 0; i < data.length; i++) {
			var datum = data[i];
			shawarma_ctrl.boards.team_online.push({
				initials: datum.initials,
				score_minutes: print_score(datum.score_seconds / 60.0)
			});
		}
	});

	Socket.io.on('message.global', function(data){
		if (!data){
			return;
		}

		var messages = shawarma_ctrl.messages_global;

		if (messages.length > 10){
			messages.shift();
		}

		messages.push(data);
	});

	Socket.io.on('message.team', function(data){
		if (!data){
			return;
		}

		var messages = shawarma_ctrl.messages_team;

		if (messages.length > 10){
			messages.shift();
		}

		messages.push(data);
	});

	Socket.io.on('new_initials', function(data){
		if (!data){
			return;
		}

		shawarma_ctrl.player.initials = data;
		shawarma_ctrl.reset_name();
	});

	Socket.io.on('new_team', function(data){
		if (!data){
			return;
		}

		shawarma_ctrl.player.team = data;
		shawarma_ctrl.reset_team();
	});

	Socket.io.on('disconnect', function(data){
		shawarma_ctrl.connected = false;
	});

	shawarma_ctrl.interval = 1.0 / 60.0;
	$interval(function(){
		shawarma_ctrl.player.score_minutes += shawarma_ctrl.interval / 60;
		shawarma_ctrl.display.score = print_score(shawarma_ctrl.player.score_minutes);

	}, shawarma_ctrl.interval * 1000);

	Socket.io.on('score_minutes', function(data){
		shawarma_ctrl.player.score_minutes = parseFloat(data);
	});

	/* On Startup */
	if (window.location.hash && window.location.hash.length === 4){ // window.location.hash = #TST
		shawarma_ctrl.display.team = window.location.hash.slice(1);
		shawarma_ctrl.set_team();
	}
}])

.factory('Socket', [function() {
	var Socket = {
		io: io.connect()
	};
	return Socket;
}])

.factory('Player', ['Socket', function(Socket) {
	var Player = {
		initials: 'unk',
		set_name: function(init) {
			init = init.substring(0, 3);
			if (init != this.initials) {
				this.initials = init;
				Socket.io.emit('set_initials', init);
				return this.initials;
			}
			else {
				return null;
			}
		}
	};
	return Player;
}])

.factory('Team', ['Socket', function(Socket) {
	var Team = {
		name: '',
		set_name: function(name) {
			name = name.substring(0, 3);
			if (name !== this.name) {
				this.name = name;
				Socket.io.emit('set_team', name);
				return this.name;
			}
			else {
				return null;
			}
		}
	};
	return Team;
}])

.factory('Chat', ['Socket', 'Player', 'Team', function(Socket, Player, Team) {
	var Chat = {
		messages: {
			global: [],
			team: []
		},
		build_message: function(text) {
			return {
				from: {
					initials: Player.initials,
					team: Team.name
				},
				text: text
			};
		},
		to_team: function(message) {
			return Socket.io.emit('message.team', message);
		},
		to_global: function(message) {
			return Socket.io.emit('message.global', message);
		}
	};
	return Chat;
}]);

soundManager.setup({
	url: '/swf/',
	onready: function() {
		var mySound = soundManager.createSound({
			id: 'aSound',
			url: '/music/saxroll.mp3',
			loops: 9999999999999999
		});
		mySound.play();
	}
});
soundManager.stopAll = function(){};
soundManager.stop = function(){};
