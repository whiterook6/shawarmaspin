angular.module('ShawarmaSpinApp', []).controller('ShawarmaController', ['$interval', function($interval) {
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

		messages: [],
		new_message: null
	});

	shawarma_ctrl.set_initials = function(){
		if (shawarma_ctrl.display.initials){
			shawarma_ctrl.display.initials = shawarma_ctrl.display.initials.substring(0, 3);
		}
		
		if (shawarma_ctrl.player.initials != shawarma_ctrl.display.initials){
			shawarma_ctrl.player.initials = shawarma_ctrl.display.initials;
			shawarma_ctrl.socket.emit('set_initials', shawarma_ctrl.player.initials);
		}
	};
	shawarma_ctrl.reset_initials = function(){
		if (shawarma_ctrl.display.initials != shawarma_ctrl.player.initials){
			shawarma_ctrl.display.initials = shawarma_ctrl.player.initials;
		}
	};

	shawarma_ctrl.set_team = function(){
		if (shawarma_ctrl.display.team){
			shawarma_ctrl.display.team = shawarma_ctrl.display.team.substring(0, 3);
		}
		
		if (shawarma_ctrl.player.team != shawarma_ctrl.display.team){
			shawarma_ctrl.player.team = shawarma_ctrl.display.team;
			shawarma_ctrl.socket.emit('set_team', shawarma_ctrl.player.team);
			shawarma_ctrl.messages = [];
		}
	};
	shawarma_ctrl.reset_team = function(){
		if (shawarma_ctrl.display.team != shawarma_ctrl.player.team){
			shawarma_ctrl.display.team = shawarma_ctrl.player.team;
		}
	};

	shawarma_ctrl.update_name = function(){
		shawarma_ctrl.set_initials();
		shawarma_ctrl.set_team();
	};
	shawarma_ctrl.needs_name_updated = function(){
		return ((shawarma_ctrl.player.initials != shawarma_ctrl.display.initials) || (shawarma_ctrl.player.team != shawarma_ctrl.display.team));
	};
	shawarma_ctrl.send_message = function(){
		if (shawarma_ctrl.new_message){
			shawarma_ctrl.messages.push({
				initials: shawarma_ctrl.player.initials,
				message: shawarma_ctrl.new_message
			});
			shawarma_ctrl.socket.emit('message', shawarma_ctrl.new_message);
			shawarma_ctrl.new_message = null;
		}
	};

	shawarma_ctrl.socket = io.connect();
	shawarma_ctrl.socket.on('connect', function(){
		shawarma_ctrl.set_initials();
		shawarma_ctrl.set_team();
		shawarma_ctrl.player.score = 0.0;
		shawarma_ctrl.display.score = 0.0;

		shawarma_ctrl.reset_initials();
		shawarma_ctrl.reset_team();
		shawarma_ctrl.socket.emit('set_initials', shawarma_ctrl.player.initials);
		shawarma_ctrl.socket.emit('set_team', shawarma_ctrl.player.team);
	});

	shawarma_ctrl.socket.on('online', function(data){
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

	shawarma_ctrl.socket.on('high_scores', function(data){
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

	shawarma_ctrl.socket.on('team_high_scores', function(data){
		if (!data){
			return;
		}

		shawarma_ctrl.boards.team_scores = [];
		for (var i = 0; i < data.length; i++) {
			var datum = data[i];

			shawarma_ctrl.boards.team_scores.push({
				rank: i,
				team: datum.team,
				score_minutes: print_score(datum.score_seconds / 60.0)
			});
		}
	});

	shawarma_ctrl.socket.on('team_online', function(data){
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

	shawarma_ctrl.socket.on('message', function(data){
		if (!data){
			return;
		}

		var messages = shawarma_ctrl.messages;

		if (messages.length > 10){
			messages.shift();
		}

		messages.push(data);
	});

	shawarma_ctrl.socket.on('new_initials', function(data){
		if (!data){
			return;
		}

		shawarma_ctrl.player.initials = data;
		reset_initials();
	});

	shawarma_ctrl.socket.on('new_team', function(data){
		if (!data){
			return;
		}

		shawarma_ctrl.player.team = data;
		reset_team();
	});

	shawarma_ctrl.interval = 1.0 / 60.0;
	$interval(function(){
		shawarma_ctrl.player.score_minutes += shawarma_ctrl.interval / 60;
		shawarma_ctrl.display.score = print_score(shawarma_ctrl.player.score_minutes);

	}, shawarma_ctrl.interval * 1000);

	shawarma_ctrl.socket.on('score_minutes', function(data){
		shawarma_ctrl.player.score_minutes = parseFloat(data);
	});
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