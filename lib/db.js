var DB = {
	db_call: function(query, params, error_msg, success_callback) {
		pool.getConnection(function(error, connection){
			if (error){
				log_message(error_msg+": Connection error: "+error);
				return;
			}

			connection.query(query, params, function(error, results){
				connection.release();
				if (error){
					log_message(error_msg+": Query error: "+error);
				} else {
					success_callback(results);
				}
			});
		});
	}
};

module.exports = DB;
