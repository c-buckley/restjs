"use strict";
var rest = require('./rest.js');
var querystring = require('querystring'); 

/**
*	authCall
*	packages data based on service type
*	@param	{string}	type		name of service
*	@param	{object}	config	client auths
*	@param	{string}	code		refresh token
*	@param	{object}	opts		call options
*/
function authCall(config, opts){
	var body = {};
	var head = opts;
	
	
	body = config; // for special config cases
	body.grant_type = "refresh_token";
	body.client_secret = config.consumer_secret;
	body.client_id = config.consumer_key;
	body.refresh_token = config.refresh_token;
	body = querystring.stringify(body);
	
	head.method = 'POST';
	head.headers['Content-Type'] = 'application/x-www-form-urlencoded';
	head.path = config.refresh_path;
	head.headers.Accept = "application/json";
	head.headers['Content-length'] = body.length;
	
	return {body: body, head: head};
}

/**
*	cloneObject
*	prevents mutating opts
*	@param	{object}	object to clone
*	@return	{object}	clone of object
*/
function cloneObject(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    var temp = obj.constructor(); // give temp the original obj's constructor
		var key;
		for (key in obj) {
		  if (obj.hasOwnProperty(key)) {
				if(key !== 'agent'){
					temp[key] = cloneObject(obj[key]);
				}
			}
    }
    return temp;
}

/**
*	refresh token
*	will modifiy auth
*	@param	{object}		auth		auth information
*	MUST BE
*	{
*		service:	{string}	name of service,
*		token:		{token}	auth information,
*		expires:	{number}	token experation unix time
*	}
*	@param	{function}	callback	function(newToken)
*	@param	{opbject}		oldOpts		service header options 
*/
function refreshToken(auth, oldOpts, body, currentTime, callback){
	var opts = cloneObject(oldOpts);
	var info = authCall(auth, opts);
	rest(info.head, info.body, function(err, res){
		if(err){
			console.log("[auth][refreshToken]"+ err);
			callback(err);
		}else{
			var newToken = JSON.parse(res.message);
			if(newToken.errorCode){//handle errors
				callback(newToken);
			}else{//success, package data
				console.log('refreshing');
				auth.access_token = newToken.access_token; // only guarenteed response
				
				
				//constructs new date in UNIX time bassed off current date and expires_in
				if(currentTime){
					var expires = newToken.expires_in;
					expires = expires + currentTime; 
					auth.expires = expires;
				}
				
				//refreshToken is optional do not delete old if not passed
				if(newToken.refresh_token){
					auth.refresh_token = newToken.refresh_token;
				}
				
				rest(oldOpts, body, callback);
			}
		}
	});
}

/**
*	Attemt Request token
*	@param	{object}		auth		auth information
*	MUST BE
*	{
*		service:	{string}	name of service,
*		token:		{token}	auth information,
*		expires:	{number}	token experation unix time
*	}
*	@param	{function}	callback	function(newToken)
*	@param	{opbject}		oldOpts		service header options 
*/
function attemptRequest(auth, oldOpts, body, callback){
	var currentTime = new Date().getTime(); 
	currentTime = Math.ceil(currentTime * 0.001);
	if(auth.expires <= currentTime){//token is invalid if expires is undefined always returns false
		console.log('old token');
		refreshToken(auth, oldOpts, body, currentTime, callback);
	}else{//attempt request
		rest(oldOpts, body, function(err, response){
			if(err){
				callback(err);
			}else{
				if(response.statusCode == 401){ //auth error
					console.log(response.body);
					refreshToken(auth, oldOpts, body, null, callback);
				}else{
					callback(null, response);
				}
			}
		});
	}
}

exports.call = attemptRequest;