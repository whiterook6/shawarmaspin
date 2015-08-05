angular.module('ShawarmaSpinApp', []).controller('ShawarmaController', ['$interval', function($interval) {
	var shawarma_ctrl = this;

	shawarma_ctrl.socket = io.connect();

	function makeID(){
		var text = "";
		var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

		for( var i=0; i < 3; i++ ){
			text += possible.charAt(Math.floor(Math.random() * possible.length));
		}

		return text;
	}

	shawarma_ctrl.initials = makeID();
	shawarma_ctrl.socket.emit('setInitials', shawarma_ctrl.initials);

	shawarma_ctrl.high_scores = [];
	shawarma_ctrl.online_board = [];

	shawarma_ctrl.score = 0.0;
	shawarma_ctrl.display_score = 0.0;

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

	shawarma_ctrl.socket.on('online', function(data){
		if (!data){
			return;
		}

		shawarma_ctrl.online_board = [];
		for (var i = 0; i < data.length; i++) {
			shawarma_ctrl.online_board.push({
				initials: data[i].initials
			});
		}
	});

	shawarma_ctrl.socket.on('high_score', function(data){
		if (!data){
			return;
		}

		shawarma_ctrl.high_scores = [];
		for (var i = 0; i < data.length; i++) {
			shawarma_ctrl.high_scores.push({
				rank: i,
				initials: data[i].initials,
				score: print_score(data[i].score_seconds / 60.0)
			});
		}
	});

	shawarma_ctrl.socket.on('score', function(data){
		shawarma_ctrl.score = parseFloat(data);
		shawarma_ctrl.display_score = print_score(shawarma_ctrl.score);
	});

	var interval=1.0 / 60.0;
	$interval(function(){
		shawarma_ctrl.score += interval / 60;
		shawarma_ctrl.display_score = print_score(shawarma_ctrl.score);
	}, interval * 1000);
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