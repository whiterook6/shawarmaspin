angular.module('ShawarmaSpinApp', ['ngRoute'])
	.config(['$routeProvider', function($routeProvider){
		$routeProvider
			.when('/',       { templateUrl: 'views/spin.html',   controller: 'ShawarmaController', controllerAs: 'shawarma_ctrl' })
			.when('/online', { templateUrl: 'views/online.html', controller: 'ShawarmaController', controllerAs: 'shawarma_ctrl' })
			.when('/scores', { templateUrl: 'views/scores.html', controller: 'ShawarmaController', controllerAs: 'shawarma_ctrl' })
			.when('/status', { templateUrl: 'views/status.html', controller: 'ShawarmaController', controllerAs: 'shawarma_ctrl' })
			.when('/:team',  { templateUrl: 'views/spin.html',   controller: 'ShawarmaController', controllerAs: 'shawarma_ctrl' });
	}])

	.controller('ShawarmaController', ['$interval', '$routeParams', 'Socket', 'Team', 'Player', 'Chat', function($interval, $routeParams, Socket, Team, Player, Chat) {
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

		shawarma_ctrl.set_name = function(){
			if (shawarma_ctrl.display.initials == Player.initials){
				return;
			}

			shawarma_ctrl.display.initials = Player.set_name(shawarma_ctrl.display.initials);
			shawarma_ctrl.player.initals = shawarma_ctrl.display.initials;
		};
		shawarma_ctrl.reset_name = function(){
			shawarma_ctrl.display.initials = Player.initials;
		};

		shawarma_ctrl.set_team = function(){
			if (shawarma_ctrl.display.team == Team.name){
				return;
			}

			shawarma_ctrl.display.team = Team.set_name(shawarma_ctrl.display.team);
			shawarma_ctrl.player.team = shawarma_ctrl.display.team;

			shawarma_ctrl.messages_team = [];
		};

		shawarma_ctrl.reset_team = function(){
			shawarma_ctrl.display.team = Team.name;
		};

		shawarma_ctrl.update_name = function(){
			shawarma_ctrl.set_name();
			shawarma_ctrl.set_team();
		};

		shawarma_ctrl.needs_name_updated = function(){
			return ((Player.initials != shawarma_ctrl.display.initials) || (Team.name != shawarma_ctrl.display.team));
		};

		shawarma_ctrl.send_message_global = function(){
			if (shawarma_ctrl.new_message_global){
				var message = new Chat.Message(shawarma_ctrl.new_message_global);
				message.send_to_global();

				shawarma_ctrl.messages_global.push(message);
				shawarma_ctrl.new_message_global = null;
			}
		};

		shawarma_ctrl.send_message_team = function(){
			if (shawarma_ctrl.new_message_team){
				var message = new Chat.Message(shawarma_ctrl.new_message_team);
				message.send_to_team();

				shawarma_ctrl.messages_team.push(message);
				shawarma_ctrl.new_message_team = null;
			}
		};

		Socket.io.on('connect', function(){
			shawarma_ctrl.set_name();
			shawarma_ctrl.set_team();
			shawarma_ctrl.player.score = 0.0;
			shawarma_ctrl.display.score = 0.0;
			shawarma_ctrl.connected = true;
		});

		Socket.io.on('disconnect', function(data){
			shawarma_ctrl.connected = false;
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

		shawarma_ctrl.interval = 1.0 / 60.0;
		$interval(function(){
			shawarma_ctrl.interval_count ++;
			shawarma_ctrl.player.score_minutes += shawarma_ctrl.interval / 60; // (should be about 1/3600), so every 60 frames it adds 1/60th of a minute
			shawarma_ctrl.display.score = print_score(shawarma_ctrl.player.score_minutes);

		}, shawarma_ctrl.interval * 1000);

		Socket.io.on('score', function(data){
			shawarma_ctrl.player.score_minutes = parseFloat(data.seconds) / 60.0;
			shawarma_ctrl.interval = parseFloat(data.speed) / 60.0; // should be around 1/60
		});

		if ($routeParams.team){
			shawarma_ctrl.display.team = $routeParams.team;
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
				if (!init){
					return;
				}

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
				if (name){
					name = name.substring(0, 3);
				} else {
					name = null;
				}

				if (name !== this.name) {
					this.name = name;
					Socket.io.emit('set_team', name);
					return this.name;
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
			}
		};
			
		Message = function(text){
			this.from = {
				initials: Player.initials,
				team: Team.name
			};
			this.text = text;
		};

		Message.prototype = {
			constructor: Message,
			
			send_to_team: function(){
				return Socket.io.emit('message.team', this);
			},

			send_to_global: function(){
				return Socket.io.emit('message.global', this);
			}
		};

		Chat.Message = Message;
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
