const express = require('express');
const app =express();
app.use(express.json());
app.use(express.text());
const fs = require('fs');

const lib = require('./Platform/lib');
const parser=require('./Platform/parser');
const LoLsPath = './LanguageGrammar/';
const DefaultMetalanguagePath= LoLsPath + 'OMeta/bs-ometa-js-compiler.js';
var DefaultMetalanguage = require(DefaultMetalanguagePath),
	DefaultMetalanguageId = 'LMeta28c00bd7-f8f9-4150-bd81-95e9c19e989c';
    DefaultRuntimeId = 'RMetaee1df5a3-1dae-4905-adc9-5034bf1fa5b9';
var R = {
		id: DefaultRuntimeId,
		evaluate: function (code) {return eval(code)}
	};

class LanguageOfLanguages {
  	constructor(prefix, props) {
  		this._id = prefix + LanguageOfLanguages.uuid();
		this._version = Date.now();
		for (var p in props)
    		if (props.hasOwnProperty(p))
      			this[p] = props[p]
    }
	static readLoLs(props) {
		if (!props.hasOwnProperty('_id')) 
			return props
		fs.readFile(LoLsPath + props['_id'], 'utf-8', (err, data) => {
			if (err) 
				return props
			return data;
		})
	}
	static uuid() {
	  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	  });
	}
 	_id = undefined				// guid for this LoLs item
 	get id() {return this._id}
	_version = undefined		// Date time stamp number of milliseconds 
								// that have passed since January 1, 1970.
	get version() {return this._version}
	name = "Unnamed"
	description = undefined     // string about this LoLs item
	authors = undefined			// string listing the names of authors
	license = undefined			// string with license for this LoLs item
	website = undefined			// URL to website about this LoLs item
	isStored() {
		fs.access(LoLsPath + this.id, fs.F_OK, (err) => {
  			if (err) 
    			return false
  			return true
		})
	}
	get serializedFields () {
		return ['id','version','name','description','authors','license','website']
	}
	store(res, replace) {
		var result;
		if (this.isStored() && replace != true)
			return {statusCode: 400, message: '' + this.id + ' file already exists'};		var props = ['id', 'version', 'description', 'authors', 'license','website']
		var data = JSON.stringify(this, this.serializedFields, '\t');
		fs.writeFile(LoLsPath + this.id, data, (err) => {
    		if (err) {
    			result = {statusCode: 400, message: '' + err}
       		} else {
    			result = {statusCode: 200, message: '' + this.id + ' file saved'}
       		}
       		if (res != undefined) {
				res.statusCode = result.statusCode;
				res.send(result.message); 
    		}      		
			return result
    	})
	}
}

class LoLsLanguage extends LanguageOfLanguages {
  	constructor(props) {
  		super('L', props=LanguageOfLanguages.readLoLs(props));
		if (props.hasOwnProperty('pipeLineIds')) {
      		this.pipelineIds = props['pipeLineIds']
      	} 
      	else {
      		if (props.hasOwnProperty('pipeLine')) 
      			this.pipeline = props['pipeLine']
      	}
    }
	_pipeline = []
    get pipeline() {return this._pipeline}
	set pipeline(pipe) {this._pipeline = pipe}   // ????????
    get pipelineIds() {return this._pipeline.map((x) => {return x.id})}
	set pipelineIds(ids) {
		var pipe=[], props = {id: undefined}, prefix, last = undefined, error = '';
      	for (var i= 0; i < ids.length-1; i++) {
      		props.id = ids[i];
      		prefix = props.id[0];
      		if (pprefix == 'L') 
      			pipe[i] = new LoLsLanguage(props)
      		else 
      			pipe[i] = new LoLsGrammmar(props)      		
      		if (last != undefined && last.outputType != pipe[i].inputType)
      			error = error+' '(i-1)+':'+last.outputType+'~'+pipe[i].inputType;
      		last = pipe[i];
      	}
      	if (error != '')	
      		return 'Pipeline mismatch'+error
		this._pipeline = pipe;
	}
	get inputType() {
		if (this._pipeline.length == 0)
			return undefined;
		return this._pipeline[0].inputType;
	}
	get outputType() {
		if (this._pipeline.length == 0)
			return undefined;
		return this._pipeline[this._pipeline.length-1].outputType;
	}
	translate(source) {
		var result = source;
		for (var i=0; i < this._pipeline.length; i++) {
			result=this._pipeline[i].translate(result);
		}
		return result;
	}
	get serializedFields () {
		var fields = super.serializedFields;
		return fields.concat(['pipelineIds'])
	}
}

class LoLsGrammar extends LanguageOfLanguages {
  	constructor(props) {
  		super('G', props=LanguageOfLanguages.readLoLs(props));
		for (var p in props)
    		if (props.hasOwnProperty(p))
      			this[p] = props[p]
    	}
    _status = undefined
    get status() {return this._status}
    _source = undefined 			// source for Grammar
    set source(value) {
    	this._source = value
		this.metalanguage = this._metalanguage
		this.runtime = this._runtime

    }
    get source() {return this._source}
	_startRule = undefined			// string key from rules
	set startRule(value){
		if (this._rules === undefined)
			return this._startRule = value 
		if (value === undefined)
			return this._startRule = Object.keys(this._rules)[0]
		if (this._rules.hasOwnProperty(value))
			return this._startRule = value
		this._status = '' + value + ' not a rule'
		return this._startRule = undefined 
	}
	get startRule() {return this._startRule}
	inputType = 'text/plain'
	outputType = 'text/javascript'
	_rulesSource = undefined		// string with sources of rules
	get rulesSource() {return this._rulesSource}
	_rules = undefined				// rule name keys with functions executes each rule
	_metalanguage = MetaLang		// LoLs metalanguage for this grammar
	set metalanguage(value) {
		if (value === undefined)
			this._metalanguage = MetaLang
		else
			this._metalanguage = value
		if (this._source === undefined)
			return this.status
    	try {
    		this._rulesSource = this._metalanguage.translate(this._source);
    		this._status = 'translated';
    	}
    	catch (e) {
			if (e.errorPos==undefined) {
				this._status = e.toString() + " at unknown postion " + e.errorPos;		
			} else {
				this._status = e.toString() + " at " + e.errorPos + " " + source.substring(e.errorPos);
			}
			this._rulesSource = undefined;
		}
		return this.status
	}  
	set metalanguageId(id) {
		if (MetaLang.id == id)
			return this._metalanguage = MetaLang
		this._metalanguage = MetaLang   // temp needs to load from file
	}
	get metalanguageId() {
		if (this._metalanguage == undefined)
			return undefined
		return this._metalanguage.id
	}
	_runtime = R  					// metalanguage runtime environment
	set runtime(value) {
		if (value === undefined)
			this._runtime = R
		if (this._rulesSource === undefined)
			return this.status
		try {
			this._rules = this._runtime.evaluate(this._rulesSource)
			this._status = 'rules sets'
			this.startRule = this._startRule
			if (this.startRule != undefined)			
				this._status = 'ready'
		} catch (e) {
			this._rules = undefined
			this._status = '' + e
		}
		return this.status
	}
	set runtimeId(id) {
		if (R.id == id)
			return this.runtime = R
		this.runtime = R				// temp needs to load from file
	}
	get runtimeId() {return this._runtime.id}	
	translate(sourceInput) {
		var result;
		if (this.startRule === undefined || this._rules === undefined)
			return undefined;
		if (this.inputType == 'text/plain') {
			result=this._rules.matchAll(sourceInput, this.startRule, undefined, 
				function(list, pos) {
					throw lib.objectThatDelegatesTo(parser.fail, {errorPos: pos})
				});
		}
		else {
			result=this._rules.match(sourceInput, this.startRule, undefined, 
				function(list, pos) {
					throw lib.objectThatDelegatesTo(parser.fail, {errorPos: pos})
				});
		};
		return result;
	}
	get serializedFields () {
		var fields = super.serializedFields;
		return fields.concat(['status','source','startRule','rulesSource',
							  'inputType','outputType',
							  'metalanguageId','runtimeId' ])
	}
}
var G1 = new LoLsGrammar(
	 		{startRule: "topLevel",
	 		 rules: DefaultMetalanguage.BSOMetaJSParser,
	 		 inputType: 'text/plain',
			 outputType: 'application/javascript'});
G1._rules = DefaultMetalanguage.BSOMetaJSParser;
var G2 = new LoLsGrammar(
		 	{startRule: "trans",
		 	 rules: DefaultMetalanguage.BSOMetaJSTranslator,
		 	 inputType: "application/javascript",
			 outputType: 'text/javascript'});
G2._rules = DefaultMetalanguage.BSOMetaJSTranslator;
var MetaLang = new LoLsLanguage(
	{name: "OMeta JS",
	 pipeline: [
	 	new LoLsGrammar(
	 		{startRule: "topLevel",
	 		 rules: DefaultMetalanguage.BSOMetaJSParser,
	 		 inputType: 'text/plain',
			 outputType: 'application/javascript'}), 
		new LoLsGrammar(
		 	{startRule: "trans",
		 	 rules: DefaultMetalanguage.BSOMetaJSTranslator,
		 	 inputType: "application/javascript",
			 outputType: 'text/javascript'})]
	});	
 MetaLang._pipeline= [G1, G2];
// console.log(JSON.stringify(G1, G1.serializedFields, '\t'));
// console.log(JSON.stringify(G1, null, '\t'));

// console.log(JSON.stringify(G2, G2.serializedFields, '\t'));
// console.log(JSON.stringify(G2, null, '\t'));

// console.log(JSON.stringify(MetaLang, MetaLang.serializedFields, '\t'));
// console.log(JSON.stringify(MetaLang, null, '\t'));

var MathLang = new LoLsGrammar(
	{name: "Math", 
	 outputType: 'text/plain'});
// console.log(JSON.stringify(MathLang, MathLang.serializedFields, '\t'));
// console.log(JSON.stringify(MathLang, null, '\t'));

	 
// temp for testing
function selectLanguage(id) {
  if (id == 'Math') {
      return MathLang;
  } else {
  if (id == 'OMeta JS') {
      return MetaLang;
  }};
  return undefined;
}

// temp for testing
function saveInGrammar(source, rules, grammarId) {
	if (grammarId===undefined)
		return;
	MathLang.source = source
}
// SERVICES
// return translation of a source object using a language 
// new rules for a grammar can be saved 
app.post('/', (req, res) => {
   	var source=req.body, languageId=req.query['Language'], grammarId=req.query['SaveIn'];
   	var language = selectLanguage(languageId), ans;
   	if (language === undefined)
      res.send('""' + languageId + '" not supported."');
   	try {
		ans = language.translate(source);
		if (grammarId !=undefined)
			saveInGrammar(source, ans, grammarId)
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

// create a language resource
app.put('/Language/', (req, res) => {
	var language=new LoLsLanguage(req.body), ans;
	if (language != undefined) 
		ans =language.store(res)
	else {
		res.statusCode = 400;
		res.send('Unable to create Language');
	}
});

// create a grammar resource
app.put('/Grammar/', (req, res) => {
	var grammar=new LoLsGrammar(req.body);
	if (grammar != undefined) 
		grammar.store(res)
	else {
		res.statusCode = 400;
		res.send('Unable to create Grammar');
	}
});

// remove a language or grammar resource
app.delete('/', (req, res) => {
	const id = req.body['id'];		
	fs.unlink(LoLsPath + id, function (err) { 
		if (err) {
			res.statusCode = 400;
			res.send('' + err)
		} else {
			res.statusCode = 200;
			res.send('Deleted ' + id);
		}
	});
});

//PORT ENVIRONMENT VARIABLE
const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Listening on port ${port}..`));