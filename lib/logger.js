Logger = {
	level: 'debug',

	notice: function(message){
		console.log(' [NOTICE][' + Timer.timestamp() + ']: ' + message);
	},

	debug: function(message){
		if (this.level == 'debug'){
			console.log('  [DEBUG][' + Timer.timestamp() + ']: ' + message);
		}
	},

	warning: function(message){
		if (this.level == 'debug' || this.level == 'warning'){
			console.log('[WARNING][' + Timer.timestamp() + ']: ' + message);
		}
	},

	error: function(message){
		if (this.level == 'debug' || this.level == 'warning' || this.level == 'error'){
			console.log('  [ERROR][' + Timer.timestamp() + ']: ' + message);
		}
	}
};

module.exports = Logger;
