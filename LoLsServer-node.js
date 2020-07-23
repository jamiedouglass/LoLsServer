const http = require('http');
const lib = require('./lib');
const parser=require('./parser');
const BSOMetaJSParser= require('./OMeta/bs-ometa-js-compiler.js');

var BSOMetaJSParserGrammar = {
		name: "BSOMetaJSParser", 
		startRule: "topLevel", 
		rules: BSOMetaJSParser.BSOMetaJSParser,
		listInput: true},
	BSOMetaJSTranslatorGrammar = {
		name: "BSOMetaJSTranslator", 
		startRule: "trans", 
		rules: BSOMetaJSParser.BSOMetaJSTranslator,
		listInput: false};
var lang = {
	name: "OMeta JS", 
	executableResult: false, 
	pipe: [
		BSOMetaJSParserGrammar,
		BSOMetaJSTranslatorGrammar]};

var source = "ometa math {\
  expression = term:t space* end           -> t,\
  term       = term:t \"+\" factor:f         -> Le('Add', t, f)\
             | term:t \"-\" factor:f         -> Le('Subtract', t, f)\
             | factor,\
  factor     = factor:f \"*\" primary:p      -> Le('Multiply', f, p)\
             | factor:f \"/\" primary:p      -> Le('Divide', f, p)\
             | primary,\
  primary    = Group\
             | Number,\
  Group      = \"(\" term:t \")\"              -> Le('Group', t),\
  Number     = space* digits:n             -> Le('Number', n),\
  digits     = digits:n digit:d            -> (n * 10 + d)\
             | digit,\
  digit      = ^digit:d                    -> d.digitValue()\
}";

function translateWith(source, lang) {
	var pipe=lang.pipe, rules, result=source;
	if (pipe.length==0) return result;
	for (var i=0; i < pipe.length; i++) {
		rules=pipe[i].rules;
		if (pipe[i].listInput) {
			result=rules.matchAll(result, pipe[i].startRule, undefined, 
				function(list, pos) {
					throw lib.objectThatDelegatesTo(parser.fail, {errorPos: pos})
				});
		}
		else {
			result=rules.match(result, pipe[i].startRule, undefined, 
				function(list, pos) {
					throw lib.objectThatDelegatesTo(parser.fail, {errorPos: pos})
				});
		};
	};
	if (lang.executableResult) 
		eval(result);
	return result;		
};

http.createServer(function (req, res) {
  var debug = false;
  if (debug) {
		ans = translateWith(source, lang);
  } else {
	try {
		ans = translateWith(source, lang);
	} catch (e) {
		if (e.errorPos==undefined) {
			ans = e.toString() + " at unknown postion " + e.errorPos;		
		} else {
			ans = e.toString() + " at " + e.errorPos + " " + source.substring(e.errorPos);
		}
	};
  };
	res.writeHead(200, {'Content-Type': 'text/plain'});
	res.end('LoLs Parse is ' + ans);
}).listen(8080);