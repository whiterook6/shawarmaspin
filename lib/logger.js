var Logger = {
	message: function(message) {
		console.log('[' + Timer.timestamp() + ']: ' + message);
	}
};

module.exports = Logger;
