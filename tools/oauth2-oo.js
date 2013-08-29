"use strict";
var rest = require('../rest.js').rest;
var querystring = require('querystring');

/**
 *	oauth 2
 *
 *	oauth 2 request
 *	@constructor
 */
function Oauth2(options, config) {
	this.options = options;
	this.config = config;
	//state to do quick checks on access key changes
	this.state = config;
}

/**
 *	authCall
 *
 *	packages body and head for refresh call
 *	@param	{object}	config	optional config to be used instead of config passed in constructor
 *	@return {object}	return Object
 *											.head		head of request
 *											.body		body of request
 */
Oauth2.prototype.refreshCall = function authCall(config) {
	config = config || this.config;
	var body = {};
	var head = this.options;

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

	return {
		body : body,
		head : head
	};
};

/**
 *	cloneObject
 *	clones object to prevent mutation, returns number if error
 *	@param	{object}	object to clone
 *	@return	{object}	clone of object
 */
function cloneObject(obj) {
	var returnObj;
	try {
		returnObj = JSON.parse(JSON.stringify(obj));
	} catch (e) {
		log.error(e);
		returnObj = -1;
	}
	return returnObj;
}

/**
 *	atomic refresh token
 *	
 *	@param	{object}		auth	any special auth needed
 *	@param	{function}	done	function to call on completion 
 *															function(err, newToken)
 */
Oauth.prototype.refreshToken = function refreshToken(auth, done) {
	var info = authCall(auth);
	rest(info.head, info.body, function (err, res) {
		if (err) {
			console.log("[auth][refreshToken]" + err);
			callback(err);
		} else {
			var newToken;
			try {
				//oauth 2 standard is to return a JSON object however some services do not support this
				newToken = JSON.parse(res.message);
			} catch(e){
				//todo: figure handling non json responses
				callback(e);
			}
			if (Math.floor(newToken.statusCode / 100) !== 2) { //handle errors
				callback(newToken);
			} else { //success, package data
				console.log('refreshing');
				auth.access_token = newToken.access_token; // only guarenteed response

				//convert seconds till to epoch time of expiration
				if (newToken.expires) {
					var expires = newToken.expires_in;
					expires = expires + currentTime;
					auth.expires = expires;
				}

				//refreshToken is optional do not delete old if not passed
				if (newToken.refresh_token) {
					auth.refresh_token = newToken.refresh_token;
				}
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
function attemptRequest(auth, oldOpts, body, callback) {
	var currentTime = new Date().getTime();
	currentTime = Math.ceil(currentTime * 0.001);
	if (auth.expires <= currentTime) { //token is invalid if expires is undefined always returns false
		console.log('old token');
		refreshToken(auth, oldOpts, body, currentTime, callback);
	} else { //attempt request
		rest(oldOpts, body, function (err, response) {
			if (err) {
				callback(err);
			} else {
				if (response.statusCode == 401) { //auth error
					console.log(response.body);
					refreshToken(auth, oldOpts, body, null, callback);
				} else {
					callback(null, response);
				}
			}
		});
	}
}

exports.call = attemptRequest;
