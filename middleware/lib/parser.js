"use strict";

var findType = /(\w+\/?\w+)/;

//Make JSON.parse async
function parseJSON(str, callback) {
  try {
    var parsed = JSON.parse(str);
  } catch (e) {
    return callback(e);
  }

  callback(null, parsed);
}

var supportedParsers = {
  'application/json': parseJSON,
  'text/json': parseJSON,
  'text/x-json': parseJSON,
  'application/xml': require('xml2js').parseString,
  'text/xml': require('xml2js').parseString
};

module.exports = function parser(res, next) {
  var matchedContentType = (res.headers['content-type'] || '').match(findType),
      parserLib;

  if (!(matchedContentType && (parserLib = supportedParsers[matchedContentType[0]]))) return next();

  parserLib(res.body, function(err, parsed) {
    res.parsedBody = parsed;
    next();
  });
};
