"use strict";

/**
*	parseJSONHelper
*
*	parses JSON objecct, recursion helper
*	@param	{object} jsonObj	JSON object to be parsed
*	@return	{string}					XML output
*/
function parseJsonHelper(obj){
	var xml = '';
	if(obj){//check null
		if(typeof obj !== 'object'){
			//proper value
			xml = obj;
		}else if(obj instanceof Array){
			var stop = obj.length, i;
			for(i = 0; i < stop; i += 1){
				xml += "<"+i+">"+parseJsonHelper(obj[i])+"</"+i+">"
			}
		}else{
			//object
			var ent;
			for(ent in obj){
				if(obj.hasOwnProperty(ent)){
					xml += "<"+ent+">"+parseJsonHelper(obj[ent])+"</"+ent+">"
				}
			}
		}
	}
	return xml;
}

/**
*	parseJSON
*
*	parses JSON objecct
*	@param	{object} jsonObj	JSON object to be parsed
*	@return	{string}					XML output
*/
function parseJson(json){
	var xml = "<?xml version='1.0' encoding='UTF-8'?>";
	return xml += parseJsonHelper(json);
}
modules.export = parseJson;