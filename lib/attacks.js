// object for the DB row.
function Attack(row){
	this.id = row.id;
	this.team = row.team;
	this.status = row.status;
	this.triggered_by = row.triggered_by;
	this.expires_at = Timer.then(row.expires_at);
	this.strength = row.strength;
}

Attack.prototype = {
	constructor: Attack,

	expired: function(){
		return this.expires_at <= Timer.now();
	},

	remaining_seconds: function(){
		return Timer.now() - this.expires_at;
	},

	getAttacks: function(callback){
		if (!callback || typeof callback !== 'function'){
			return;
		}

		DB.query("SELECT `id`, `team`, `status`, `triggered_by`, `expires_at`, `strength` FROM `team_statuses` WHERE `expires_at` > NOW()", [], "Getting Team Statuses", function(results){
			if (!results || results.length === 0){
				return;
			}

			var attacks = [];
			for (var i = results.length - 1; i >= 0; i--) {
				attacks.push(new Attack(results[i]));
			}

			callback(attacks);
		});
	}
};

module.exports = Attack;
