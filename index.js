"use strict";

/**
 * Rest module 
 */
 
function Rest(options) {
  this.encoding = options.encoding || 'utf8';
  this.protocol = options.protocol || 'https';
  this._requestModule = require(this.protocol);
}


/**
 * Generic REST invocation function
 * Should handle all verbs
 * @param	  {object}	  opts		  options for request
 * @param  	{string}	  body		  body of request
 * @param  	{Function}	callback	function(data) error handling & parseing should be done by module
 */
Rest.prototype.request = function(opts, body, callback) {
  var self = this,
      callbackArgs = [],
      isDone = false;

  body = body || '';

  function finish(err, res) {
    if (isDone) return; //This would only happen if an error occurs AFTER the res has ended...doubtful that would ever happen.

    if (err) {
      callbackArgs[0] = err; //If there's an error and no res, collect it and keep waiting until the 'end' event
    } else {
      isDone = true;
      callbackArgs[1] = res;
      callback.apply(null, callbackArgs); //Pass both the err and res to the callback, because often times the body will be just fine despite errors
    }
  }

  var req = this._requestModule.request(opts, function(res) {
    var data = '';

    res.setEncoding(self.encoding);

    res.on('data', function(d){data+=d;}); //capture data
    res.on('end', function() {
      res.body = res.message = data;
      finish(null, res);
    });
  });

  req.on('error', finish);

  req.write(body);
  req.end();
}

module.exports.Rest = Rest;
module.exports.Oauth2 = require('./tools/oauth2.js');