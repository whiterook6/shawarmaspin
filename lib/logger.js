Logger = {
	level: 'notice',

	notice: function(message){
		if (this.level == 'notice' || this.level == 'debug'){
			console.log(' [NOTICE][' + Timer.timestamp() + ']: ' + message);
		}
	},

	debug: function(message){
		if (this.level == 'debug'){
			console.log('  [DEBUG][' + Timer.timestamp() + ']: ' + message);
		}
	},

	warning: function(message){
		if (this.level != 'error'){
			console.log('[WARNING][' + Timer.timestamp() + ']: ' + message);
		}
	},

	error: function(message){
		console.log('  [ERROR][' + Timer.timestamp() + ']: ' + message);
	}
};

module.exports = Logger;
