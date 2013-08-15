"use strict";

/**
 * Rest module 
 */

/**
*	rest
*	@param	{boolean}		secure	boolean ? https : http
*	@return	{object}						rest object
*	@constructor
*/
function rest(secure){
	var self = this;
	var type = (secure) ? "https" : "http";
	self.protocol = require(type);
	return self;
}

rest.prototype = {
	/**
 * Generic REST invocation function
 * Should handle all verbs
 * @param	  {object}	  opts		  options for request
 * @param  	{string}	  body		  body of request
 * @param  	{Function}	callback	function(data) error handling & parseing should be done by module
 */
	request : function(opts, body, callback){
		var callbackArgs = [], isDone = false, self = this;

		function finish(err, res) {
			if (isDone){
				//This would only happen if an error occurs AFTER the res has ended...doubtful that would ever happen.
				return;
			}
			
			if (err) {
				//If there's an error and no res, collect it and keep waiting until the 'end' event
				callbackArgs[0] = err;
			} else {
				isDone = true;
				callbackArgs[1] = res;
				//Pass both the err and res to the callback, because often times the body will be just fine despite errors
				callback.apply(null, callbackArgs);
			}
		}

		var req = self.protocol.request(opts, function(res) {
			var data = '';

			res.on('data', function(d){data+=d;}); //capture data
			res.on('end', function(){
				//TODO remove support for res.message
				res.body = res.message = data;
				finish(null, res);
			});
		});

		req.on('error', function(e) {
			console.log('[rest] error' + e);
			finish(e);
		});

		req.write(body);
		req.end();
		}
}

module.exports = rest;
