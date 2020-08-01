const express = require('express');
const app =express();
app.use(express.json());
app.use(express.text());
const lib = require('./Platform/lib');
const parser=require('./Platform/parser');
const Metalanguage= './LanguageGrammar/OMeta/bs-ometa-js-compiler.js';
var BSOMetaJSParser= require(Metalanguage);

class LanguageOfLanguages {
  	constructor(props) {
		this.version = Date.now();
		for (var p in props)
    		if (props.hasOwnProperty(p))
      			this[p] = props[p]
    	}
	id = undefined
	version = undefined
	name = "Unnamed"
	description = ""
	author = undefined
	license = undefined
}

class LoLsLanguage extends LanguageOfLanguages {
  	constructor(props) {
  		super(props);
		for (var p in props)
    		if (props.hasOwnProperty(p))
      			this[p] = props[p]
    	}
	pipeline = []
	getInputType() {
		if (this.pipeline.length==0)
			return undefined;
		return this.pipeline[0].inputType;
	}
	getOutputType() {
		if (this.pipeline.length==0)
			return undefined;
		return this.pipeline[this.pipeline.length-1].outputType;
	}
	translate(source) {
		var result=source;
		for (var i=0; i < this.pipeline.length; i++) {
			result=this.pipeline[i].translate(result);
		}
		return result;
	}
}

class LoLsGrammar extends LanguageOfLanguages {
  	constructor(props) {
  		super(props);
		for (var p in props)
    		if (props.hasOwnProperty(p))
      			this[p] = props[p]
    	}
	startRule = undefined
	rules = undefined
	inputType = 'text/plain'
	getInputType() {
		return this.inputType;
	}
	outputType = 'text/javascript'
	getOutputType() {
		return this.outputType;
	}
	metalanguage = undefined
	platform = undefined
	translate(source) {
		var result;
		if (this.startRule === undefined || this.rules == undefined)
			return source;
		if (this.inputType == 'text/plain') {
			result=this.rules.matchAll(source, this.startRule, undefined, 
				function(list, pos) {
					throw lib.objectThatDelegatesTo(parser.fail, {errorPos: pos})
				});
		}
		else {
			result=this.rules.match(source, this.startRule, undefined, 
				function(list, pos) {
					throw lib.objectThatDelegatesTo(parser.fail, {errorPos: pos})
				});
		};
		return result;
	}
}

var MetaLang = new LoLsLanguage(
	{name: "OMeta JS",
	 pipeline: [
	 	new LoLsGrammar(
	 		{startRule: "topLevel",
	 		 rules: BSOMetaJSParser.BSOMetaJSParser,
	 		 inputType: 'text/plain',
			 outputType: 'application/javascript'}),
	 	new LoLsGrammar(
		 	{startRule: "trans",
		 	 rules: BSOMetaJSParser.BSOMetaJSTranslator,
		 	 inputType: "application/javascript",
			 outputType: 'text/javascript'})]
	});

var MathLang = new LoLsGrammar(
	{name: "Math", 
	 startRule: "expression",
	 inputType: 'text/plain',
	 outputType: 'text/plain'});
	 
// temp for testing
function selectLanguage(name) {
  if (name == 'Math') {
      return MathLang;
  } else {
  if (name == 'OMeta JS') {
      return MetaLang;
  }};
  return undefined;
}

// temp for testing
function saveIn(rules, name) {
	if (name===undefined)
		return;
	if (name == 'Math')
		MathLang.rules=eval(rules)
}

// return translation of a source object using a language 
// new rules for a language can be saved 
app.post('/', (req, res) => {
   	var ans, source=req.body, language=req.query['Language'], saveName=req.query['SaveIn'];
   	language = selectLanguage(language);
   	if (language === undefined)
      res.send('' + language + " not supported.");
   	try {
		ans = language.translate(source);
		saveIn(ans, saveName);
	} 
	catch (e) {
		if (e.errorPos==undefined) {
			ans = e.toString() + " at unknown postion " + e.errorPos;		
		} else {
			ans = e.toString() + " at " + e.errorPos + " " + source.substring(e.errorPos);
		}
   	};
	res.send('' + ans);
});

// retrieve a language resource(s) meeting search criteria
app.get('/', (req, res) => {
});

// replace a language resource, create if absent
app.put('/', (req, res) => {
});

// remove a language resource
app.delete('/', (req, res) => {
});

//PORT ENVIRONMENT VARIABLE
const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Listening on port ${port}..`));