var Timer = {
	timestamp: function() {
		return new Date().toUTCString();
	},
	now: function() {
		return (new Date() / 1000.0);
	},
	then: function(mysql_date) {
		return (new Date(mysql_date) / 1000.0);
	}
};

module.exports = Timer;
