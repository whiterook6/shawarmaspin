angular.module('ShawarmaSpinApp', ['ngRoute'])
	.config(['$routeProvider', function($routeProvider){
		$routeProvider
			.when('/',       { templateUrl: 'views/spin.html',   controller: 'ShawarmaController', controllerAs: 'shawarma_ctrl' })
			.when('/online', { templateUrl: 'views/online.html', controller: 'ShawarmaController', controllerAs: 'shawarma_ctrl' })
			.when('/scores', { templateUrl: 'views/scores.html', controller: 'ShawarmaController', controllerAs: 'shawarma_ctrl' })
			.when('/status', { templateUrl: 'views/status.html', controller: 'ShawarmaController', controllerAs: 'shawarma_ctrl' })
			.when('/:team',  { templateUrl: 'views/spin.html',   controller: 'ShawarmaController', controllerAs: 'shawarma_ctrl' });
	}])

	.controller('ShawarmaController', ['$interval', '$routeParams', function($interval, $routeParams) {
		function print_score(score){
			if (score < 10){
				return score.toFixed(3);
			} else if (score < 1000){
				return score.toFixed(2);
			} else if (score < 100000){
				return score.toFixed(1);
			} else {
				return Math.floor(score);
			}
		}

		function now(){
			return (new Date() / 1000.0);
		}

		var ctrl = this;
		angular.extend(ctrl, {
			boards: {
				online: [],
				high_scores: {
					count: 0,
					members: []
				},
				team_scores: {
					count: 0,
					members: []
				},
				team_online: {
					count: 0,
					members: []
				},

				/**
				 * @param interval the number of seconds since the previous tick (eg 0.016 for 60FPS, etc.)
				 */
				tick: function(interval){
					var i, entry;
					for (i = this.high_scores.members.length - 1; i >= 0; i--) {
						entry = this.high_scores.members[i];
						entry.score_seconds += interval * entry.spm;
						entry.display_score = print_score(entry.score_seconds / 60);
					}

					for (i = this.team_scores.members.length - 1; i >= 0; i--) {
						entry = this.team_scores.members[i];
						entry.score_seconds += interval * entry.spm;
						entry.display_score = print_score(entry.score_seconds / 60);
					}

					for (i = this.team_online.members.length - 1; i >= 0; i--) {
						entry = this.team_online.members[i];
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
				ctrl.spinning = true;
			} else {
				ctrl.spin = function(){
					if (!ctrl.spinning){
						ctrl.spinning = true;
						document.getElementById("bgvid").play();
					}
				};
			}
		});

		ctrl.set_name = function(){
			if (ctrl.display.initials == ctrl.player.initials){
				return;
			}

			ctrl.socket.emit('set_initials', ctrl.display.initials);
			ctrl.player.initials = ctrl.display.initials;
		};
		ctrl.reset_name = function(){
			ctrl.display.initials = ctrl.player.initals;
		};

		ctrl.set_team = function(){
			if (ctrl.display.team == ctrl.player.name){
				return;
			}

			ctrl.socket.emit('set_team', ctrl.display.team);
			ctrl.player.team = ctrl.display.team;

			ctrl.messages_team = [];
		};

		ctrl.reset_team = function(){
			ctrl.display.team = ctrl.display.team;
		};

		ctrl.update_name = function(){
			ctrl.set_name();
			ctrl.set_team();
		};

		ctrl.needs_name_updated = function(){
			var check = ((ctrl.display.initials != ctrl.player.initials) || (ctrl.display.team != ctrl.player.team));
			return check;
		};

		ctrl.send_message_global = function(){
			if (ctrl.new_message_global){
				var message = {
					from: {
						initials: ctrl.player.initials,
						team: ctrl.player.team
					}, text: ctrl.new_message_global
				};

				ctrl.socket.emit('message.global', message);
				ctrl.messages_global.push(message);
				ctrl.new_message_global = null;
			}
		};

		ctrl.send_message_team = function(){
			if (ctrl.new_message_team){
				var message = {
					from: {
						initials: ctrl.player.initials,
						team: ctrl.player.team
					}, text: ctrl.new_message_team
				};

				ctrl.socket.emit('message.team', message);
				ctrl.messages_team.push(message);
				ctrl.new_message_team = null;
			}
		};

		ctrl.socket = io.connect('http://ws.shawarmaspin.com/');
		ctrl.socket.on('connect', function(){
			// set initials if not 'unk':
			if (ctrl.display.initials != 'unk'){
				ctrl.player.initials = ctrl.display.initials;
				ctrl.socket.emit('set_initials', ctrl.display.initials);
			}


			// set team if not null (or if route requites):
			if ($routeParams.team){
				ctrl.display.team = $routeParams.team;
			}

			if (ctrl.display.team){
				ctrl.player.team = ctrl.display.team;
				ctrl.socket.emit('set_team', ctrl.display.team);
			}
			
			ctrl.player.score_seconds = 0.0;
			ctrl.player.spm = 1;
			ctrl.display.score = 0.0;
			ctrl.connected = true;
		});

		ctrl.socket.on('disconnect', function(data){
			ctrl.connected = false;
		});

		ctrl.socket.on('online', function(data){
			if (!data){
				return;
			}

			ctrl.boards.online = [];
			for (var i = 0; i < data.length; i++) {
				ctrl.boards.online.push({
					initials: data[i].initials
				});
			}
		});

		ctrl.socket.on('high_scores', function(data){
			if (!data){
				return;
			}

			ctrl.boards.high_scores = [];
			for (var i = 0; i < data.length; i++) {
				var datum = data[i];
				ctrl.boards.high_scores.push({
					rank: i,
					initials: datum.initials,
					score_seconds: datum.score_seconds,
					display_score: print_score(datum.score_seconds / 60.0),
					spm: datum.spm
				});
			}
		});

		ctrl.socket.on('team_high_scores', function(data){
			if (!data){
				return;
			}

			ctrl.boards.team_scores = [];
			for (var i = 0; i < data.length; i++) {
				var datum = data[i];

				ctrl.boards.team_scores.push({
					rank: i,
					team: datum.team,
					score_seconds: datum.score_seconds,
					display_score: print_score(datum.score_seconds / 60.0),
					spm: datum.spm
				});
			}
		});

		ctrl.socket.on('team_online', function(data){
			if (!data){
				return;
			}

			ctrl.boards.team_online = [];
			for (var i = 0; i < data.length; i++) {
				var datum = data[i];
				ctrl.boards.team_online.push({
					initials: datum.initials,
					score_seconds: datum.score_seconds,
					display_score: print_score(datum.score_seconds / 60.0),
					spm: datum.spm
				});
			}
		});

		ctrl.socket.on('message.global', function(data){
			if (!data){
				return;
			}

			var messages = ctrl.messages_global;

			if (messages.length > 10){
				messages.shift();
			}

			messages.push(data);
		});

		ctrl.socket.on('message.team', function(data){
			if (!data){
				return;
			}

			var messages = ctrl.messages_team;

			if (messages.length > 10){
				messages.shift();
			}

			messages.push(data);
		});

		ctrl.socket.on('new_initials', function(data){
			if (!data){
				return;
			}

			ctrl.player.initials = data;
			ctrl.reset_name();
		});

		ctrl.socket.on('new_team', function(data){
			if (!data){
				return;
			}

			ctrl.player.team = data;
			ctrl.reset_team();
		});

		ctrl.interval = 1.0 / 60.0;
		ctrl.last_tick = now();
		$interval(function(){
			var delay = now() - ctrl.last_tick;
			ctrl.last_tick = now();

			if (ctrl.connected){
				ctrl.boards.tick(delay);
				ctrl.player.score_seconds += delay * ctrl.player.spm;
				ctrl.display.score = print_score(ctrl.player.score_seconds / 60);
			}

		}, ctrl.interval * 1000);

		ctrl.socket.on('score', function(data){
			ctrl.player.score_seconds = parseFloat(data.score_seconds);
			ctrl.player.spm = data.spm;

			ctrl.display.score = print_score(ctrl.player.score_seconds / 60);
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
