"use strict";
/**
*	json2xml
*
*	converts JSON object to XML string
*	Warning: operates in O(n^2)
*	
*	keys that start with _ will be added to tag attributes
*	keys written in camelCase will be hyphenated i.e camel-case
*/

/**
*	ccFilter
*
*	converts camelCase to hyphenated i.e camel-case
*	@param	{string}	input	string to be converted
*	@return	{string}				hyphenated string
*/
function ccFilter(input){
	var regex = /[A-Z]/g;
	//TODO: convert to hypenated ~30 min
	return input;
}

/**
*	attScan
*
*	scans object for attributes
*	@param	{object}	obj		object to be scaned
*	@param	{string}	ent		name of object
*	@return	{string}				xml open tag
*/	
function attScan(obj, ent){
	var returnString = "<"+ccFilter(ent)
	var att;
	
	for(att in obj){
		//type check
		if(obj.hasOwnProperty(att)){
			if(att.charAt(0) === "_"){
				//append to open tag;
				returnString += " "+att.slice(1)+"=\""+obj[att]+"\"";
			}
		}
	}
	
	returnString += ">";
	return returnString;
}
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
		}else{
			var ent;
			//object
			for(ent in obj){
				if(obj.hasOwnProperty(ent)){
					console.log(ent);
					var open = attScan(obj[ent], ent);
					var close = "</"+ent +">";
					//filter att format
					if(ent.charAt(0) !== "_"){
						xml += open+parseJsonHelper(obj[ent])+close;
					}
				}
			}
		}
	}
	return xml;
}

/**
*	parseJSON
*
*	Operates in O(n^2)
*	parses JSON objecct
*	@param	{object}	jsonObj	JSON object to be parsed
*	@param	{string}	tagName	name of xml parent node, xml if undefined
*	@return	{string}					XML output
*/
function parseJson(json, tagName){
	var parent = tagName || "xml";
	var xml = '';
	return xml += "<"+parent+">"+parseJsonHelper(json)+"</"+parent+">";
}
module.export = parseJson;