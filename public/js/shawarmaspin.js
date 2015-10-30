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

		function now(){
			return (new Date() / 1000.0);
		}

		var shawarma_ctrl = this;
		angular.extend(shawarma_ctrl, {
			boards: {
				online: [],
				high_scores: [],
				team_scores: [],
				team_online: [],

				/**
				 * @param interval the number of seconds since the previous tick (eg 0.016 for 60FPS, etc.)
				 */
				tick: function(interval){
					var i, entry;
					for (i = this.high_scores.length - 1; i >= 0; i--) {
						entry = this.high_scores[i];
						entry.score_seconds += interval * entry.spm;
						entry.display_score = print_score(entry.score_seconds / 60);
					}

					for (i = this.team_scores.length - 1; i >= 0; i--) {
						entry = this.team_scores[i];
						entry.score_seconds += interval * entry.spm;
						entry.display_score = print_score(entry.score_seconds / 60);
					}

					for (i = this.team_online.length - 1; i >= 0; i--) {
						entry = this.team_online[i];
						entry.score_seconds += interval * entry.spm;
						entry.display_score = print_score(entry.score_seconds / 60);
					}
				}
			},

			display: {
				initials: 'unk',
				team: null,
				score: 0.0
			},

			player: {
				initials: 'unk',
				team: null,
				score_seconds: 0,
				spm: 1
			},

			chatrooms: {
				options: ['global', 'team'],
				view: 'global'
			},
			messages_global: [],
			messages_team: [],
			new_message: null,
			spinning: false
		});

		Modernizr.on('videoautoplay', function(result){
			if (result){
				shawarma_ctrl.spinning = true;
			} else {
				shawarma_ctrl.spin = function(){
					if (!shawarma_ctrl.spinning){
						shawarma_ctrl.spinning = true;
						document.getElementById("bgvid").play();
					}
				};
			}
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
			
			if ($routeParams.team && !shawarma_ctrl.display.team){
				shawarma_ctrl.display.team = $routeParams.team;
			}
			shawarma_ctrl.set_team();
			
			shawarma_ctrl.player.score_seconds = 0.0;
			shawarma_ctrl.player.spm = 1;
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
					score_seconds: datum.score_seconds,
					display_score: print_score(datum.score_seconds / 60.0),
					spm: datum.spm
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
					score_seconds: datum.score_seconds,
					display_score: print_score(datum.score_seconds / 60.0),
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
					score_seconds: datum.score_seconds,
					display_score: print_score(datum.score_seconds / 60.0),
					spm: datum.spm
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
		shawarma_ctrl.last_tick = now();
		$interval(function(){
			var delay = now() - shawarma_ctrl.last_tick;
			shawarma_ctrl.last_tick = now();

			if (shawarma_ctrl.connected){
				shawarma_ctrl.boards.tick(delay);
				shawarma_ctrl.player.score_seconds += delay * shawarma_ctrl.player.spm;
				shawarma_ctrl.display.score = print_score(shawarma_ctrl.player.score_seconds / 60);
			}

		}, shawarma_ctrl.interval * 1000);

		Socket.io.on('score', function(data){
			shawarma_ctrl.player.score_seconds = parseFloat(data.score_seconds);
			shawarma_ctrl.player.spm = data.spm;

			shawarma_ctrl.display.score = print_score(shawarma_ctrl.player.score_seconds / 60);
		});
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
