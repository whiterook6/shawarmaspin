var DB = {
	pool: null,
	
	query: function(query, params, error_msg, success_callback) {
		DB.pool.getConnection(function(error, connection){
			if (error){
				Logger.error(error_msg+": Connection error: "+error);
				return;
			}

			connection.query(query, params, function(error, results){
				connection.release();
				if (error){
					Logger.error(error_msg+": Query error: "+error);
				} else if (success_callback){
					success_callback(results);
				}
			});
		});
	}
};

module.exports = DB;
