const express = require('express');
const app =express();
app.use(express.json());
app.use(express.text());
const fs = require('fs');

const lib = require('./Platform/lib');
const parser=require('./Platform/parser');
const LoLsBootstrap = './LoLsBootstrap/';
const LoLsResources ='./LoLsResources/';
const DefaultMetalanguagePath= LoLsBootstrap + 'OMeta/bs-ometa-js-compiler.js';
var DefaultMetalanguage = require(DefaultMetalanguagePath),
	DefaultMetalanguageId = 'L28c00bd7-f8f9-4150-bd81';
    DefaultRuntimeId = 'Ree1df5a3-1dae-4905-adc9';

class LanguageOfLanguages {
  	constructor(props) {
  		if (props === undefined)
  			return undefined
  		if (props.hasOwnProperty('id')) {
  			this._id = props['id'];
  			delete props.id;
  		} else {
  			this._id = this.prefix + LanguageOfLanguages.uuid()};
  		if (props.hasOwnProperty('version')) {
  			this._version = props['version'];
  			delete props.version;
  		} else {
			this._version = Date.now()};
		for (var p in props)
    		if (props.hasOwnProperty(p))
      			this[p] = props[p]
    }
	static getResourceFilename(pattern) {
		if (pattern.length < 24) 
			return {statusCode: 400, 
					message: 'Must be at least 24 characters "'+pattern+'"'};
		var files = fs.readdirSync(LoLsResources) // TBD eliminate sync 
		var matches = files.filter(file => file.search(pattern) >= 0);
		if (matches.length == 0) 
			return {statusCode: 400, 
					message: 'No resource "'+pattern+'"'};
		if (matches.length > 1)  // TBD select greatest version
			return {statusCode: 400, 
					message: ''+matches.length+' resources for "'+pattern+'"'};
		return {statusCode: 200, message: matches[0]}	
	}
	static readLoLs(props) {
		var pattern;
		if (!props.hasOwnProperty('id')) 
			return props
		pattern = props['id']
		if (props.hasOwnProperty('version'))
			pattern = pattern+this.delimiter+props['version'];
		var ans = LanguageOfLanguages.getResourceFilename(pattern);
		if (ans['statusCode'] != 200)
			return ans
		return fs.readFileSync(LoLsResources + ans['message']); // TBD eliminate sync
	}
	static uuid() {
	  return 'xxxxxxxx-xxxx-4xxx-yxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	  });
	}
    get delimiter() {return '~'}
	get key() {return this.id + this.delimiter + this.version}
	get filename() {
		var name=this.name.replace(/[^0-9a-z]/gi, ''),
		    filename = this.prefix+name+this.delimiter+
		    		   this.key+this.extension
		return filename
	}
 	_id = undefined				// guid for this LoLs item
 	get id() {return this._id}
	_version = undefined		// Date time stamp number of milliseconds 
								// that have passed since January 1, 1970.
	get version() {return this._version}
	_name = "Unnamed"
	set name(value) {
		this._name = value;
		this._version = Date.now();
	}
	get name() {return this._name}
	description = undefined     // string about this LoLs item
	authors = undefined			// string listing the names of authors
	license = undefined			// string with license for this LoLs item
	website = undefined			// URL to website about this LoLs item
	_age = Date.now()
	get age() {return this._age}
	renewAge() {this._age = Date.now()}
	isStored() {
		fs.access(LoLsResources + this.filename, fs.F_OK, (err) => { // fix sync problem
  			if (err) 
    			return false
  			return true
		})
		// call sequence problem
	}
	get serializedFields () {
		return ['id','version','name','description','authors','license','website']
	}
	store(replace) {
		var result;
		if (this.isStored() && replace != true)
			return {statusCode: 400, message: '' + this.filename +
					' file already exists'};
		var data = JSON.stringify(this, this.serializedFields, '\t');
		fs.writeFile(LoLsResources + this.filename, data, (err) => {
    		if (err) {
    			result = {statusCode: 400, message: '' + err}
       		} else {
    			result = {statusCode: 200, message: '' + this.filename +
    					  ' file saved'}
       		}
			return result
    	})
    	// call sequence problem
    	return {statusCode: 200, message: '' + this.filename + ' file saved'}
	}
}

class LoLsLanguage extends LanguageOfLanguages {
  	constructor(props) {
  		super(props=LanguageOfLanguages.readLoLs(props));
		if (props.hasOwnProperty('pipeLineIds')) {    // use keys
      		this.pipelineIds = props['pipeLineIds']
      	} 
      	else {
      		if (props.hasOwnProperty('pipeLine'))    // ?????????
      			this.pipeline = props['pipeLine']
      	}
    }
    get prefix() {return 'L'}
	get extension() {return ''}
	_pipeline = []
    get pipeline() {return this._pipeline}       // ????????
	set pipeline(pipe) {this._pipeline = pipe}   // ????????
	get pipelineKeys() {return this._pipeline.map((x) => {return x.key})}
	set pipelineKeys(keys) {
		var pipe=[], last = undefined, error = '';
      	for (var i= 0; i < keys.length; i++) {
      		pipe[i] = getLoLsResource(keys[i])
      		if (last != undefined && last.outputType != pipe[i].inputType)
      			error = error+' '(i-1)+':'+last.outputType+' not '+pipe[i].inputType;
      		last = pipe[i];
      	}
      	if (error != '')	
      		return 'Pipeline mismatch '+error
		this._pipeline = pipe;
	}
	
// temp
    get pipelineIds() {return this._pipeline.map((x) => {return x.id})}
	set pipelineIds(ids) {
		var pipe=[], props = {id: undefined}, prefix, last = undefined, error = '';
      	for (var i= 0; i < ids.length; i++) {
      		props.id = ids[i];
      		prefix = props.id[0];
      		if (prefix == 'L') 
      			pipe[i] = new LoLsLanguage(props)
      		else 
      			pipe[i] = new LoLsGrammmar(props)      		
      		if (last != undefined && last.outputType != pipe[i].inputType)
      			error = error+' '(i-1)+':'+last.outputType+' not '+pipe[i].inputType;
      		last = pipe[i];
      	}
      	if (error != '')	
      		return 'Pipeline mismatch'+error
		this._pipeline = pipe;
	}
// temp

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
		return fields.concat(['pipelineIds'])   // use keys
	}
}

class LoLsGrammar extends LanguageOfLanguages {
  	constructor(props) {
  		super(props=LanguageOfLanguages.readLoLs(props));
  		if (props.hasOwnProperty('status')) {
  			this._status = props['status'];
  			delete props.status;
  		};
  		if (props.hasOwnProperty('rulesSource')) {
  			this._rulesSource = props['rulesSource'];
  			delete props.rulesSource;
  		};
		for (var p in props)
    		if (props.hasOwnProperty(p))
      			this[p] = props[p]
    	}
    get prefix() {return 'G'}
	get extension() {return ''}
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
	_rules = undefined				// rule name & functions pairs
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
				this._status = e.toString() + " at " + e.errorPos + 
								" " + source.substring(e.errorPos);
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

class LoLsRuntime extends LanguageOfLanguages {
  	constructor(props) {
  		super(props=LanguageOfLanguages.readLoLs(props));
  		if (props.hasOwnProperty('status')) {
  			this._status = props['status'];
  			delete props.status;
  		};
  		if (props.hasOwnProperty('rulesSource')) {
  			this._rulesSource = props['rulesSource'];
  			delete props.rulesSource;
  		};
		for (var p in props)
    		if (props.hasOwnProperty(p))
      			this[p] = props[p]
    	}
    get prefix() {return 'R'}
	get extension() {return '.js'}
/*
	get serializedFields () {
		var fields = super.serializedFields;
		return fields.concat([])
	}
*/
	evaluate(code) {return eval.call(null, code)}  // uses global context
}

var R = new LoLsRuntime({});

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
	{
	//id: DefaultMetalanguageId,
	 version: 1596811951335,
	 name: "OMeta JS",
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
MetaLang._id = DefaultMetalanguageId;
MetaLang._pipeline= [G1, G2];
MetaLang._pipeline[0]._rules = DefaultMetalanguage.BSOMetaJSParser;
MetaLang._pipeline[1]._rules = DefaultMetalanguage.BSOMetaJSTranslator;
var MathLang = new LoLsGrammar(
	{
	//id: "G4207537d-43d3-413f-9837",
	 version: 1596811192837,
	 name: "Math", 
	 outputType: 'text/plain'});
MathLang._id = "G4207537d-43d3-413f-9837";

const ResourceCasheSize = 10;
var resourceCashe = new Array(ResourceCasheSize);	 
// get resource from cashe or load resource from file
function getLoLsResource(id) {
// TBD include version number
// temp for testing-needed
  if (id == MathLang.id)  
      return MathLang
  if (id == MetaLang.id) 
      return MetaLang
  return undefined
// end of temp code
  var oldest = 0, oldestAge = Date.now();
  for (var i=0; i<ResourceCasheSize; i++) {
  	if (resourceCashe[i] != undefined) {
  		if (rescourceCashe[i].id == id) {
  			rescourceCashe[i].renewAge();
  			return resourceCashe[i]
  		}
  		if (resourceCashe[i].age < oldestAge) {
  			oldest = i;
  			oldestAge = resourceCashe[i].age;
  		} else {
  		// load resource id into i index
  		}
  	} else {
  		oldest = i;
  		break
  	}
  }
  // store resource currently in oldest index if defined
  // load resource id into oldest index
  return resourceCashe[oldest]
}

// SERVICES
// return translation of a source object using a language 
app.post('/', (req, res) => {
   	var ans, source=req.body;
   	var languageId=req.query['inLanguage'], language = getLoLsResource(languageId);
   	if (language === undefined)
      	res.send('"' + languageId + '" not supported.');
   	try {
		ans = language.translate(source);
	} 
	catch (e) {
		if (e.errorPos==undefined) {
			ans = e.toString() + " at unknown postion " + e.errorPos;		
		} else {
			ans = e.toString() + " at " + e.errorPos + " " +
				  source.substring(e.errorPos);
		}
  	};
	res.send('' + ans);
});

// add a translator source to a grammar  
app.post('/Grammar/', (req, res) => {
   	var source=req.body;
   	var grammarId=req.query['forGrammar'], grammar = getLoLsResource(grammarId);
   	if (grammar === undefined) {
    	res.send('""' + grammarId + '" grammar not found."'); 
	} else {
		grammar.source = source
		res.send('' + grammar.status);
	}	
});

// retrieve a language resource(s) meeting search criteria
app.get('/', (req, res) => {
	var pattern=req.body, matches;
	fs.readdir(LoLsResources, (err, files) => {
		matches = files.filter(file => file.search(pattern) >= 0)
		res.send(matches);
	})
});

// create a language resource
app.put('/Language/', (req, res) => {
	var language = new LoLsLanguage(req.body);
	if (language != undefined) {
		var result = language.store(res);
		res.statusCode = result.statusCode;
		res.send(result.message); 
	} else {
		res.statusCode = 400;
		res.send('Unable to create Language');
	}
});

// create a grammar resource
app.put('/Grammar/', (req, res) => {
	var grammar = new LoLsGrammar(req.body);
	if (grammar != undefined) {
		var result = grammar.store(res);
		res.statusCode = result.statusCode;
		res.send(result.message); 
	} else {
		res.statusCode = 400;
		res.send('Unable to create Grammar');
	}
});

// remove a language or grammar resource
app.delete('/', (req, res) => {
	var pattern=req.body, matches;
	if (pattern.length < 24) {
		res.statusCode = 400;
		res.send('Must be at least 24 characters "' + pattern + '"');
		return		
	};
	fs.readdir(LoLsResources, (err, files) => {
		matches = files.filter(file => file.search(pattern) >= 0);
		if (matches.length == 0) {
			res.statusCode = 400;
			res.send('No resource "' + pattern + '"');
			return		
		}
		if (matches.length > 1) {
			res.statusCode = 400;
			res.send('' + matches.length + ' resources for "' + pattern + '"');	
			return	
		}	
		fs.unlink(LoLsResources + matches[0], function (err) { 
			if (err) {
				res.statusCode = 400;
				res.send('' + err)
			} else {
				res.statusCode = 200;
				res.send('Deleted ' + pattern);
			}
		});
	});
});

//PORT ENVIRONMENT VARIABLE
const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Listening on port ${port}..`));