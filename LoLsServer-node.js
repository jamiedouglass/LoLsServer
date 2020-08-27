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
	DefaultMetalanguageKey = 'L28c00bd7-f8f9-4150-bd81~1596811951335', MetaLang,
    DefaultRuntimeKey = 'Ree1df5a3-1dae-4905-adc9~1596811949469', R;
var DefaultMathlanguageKey = 'G4207537d-43d3-413f-9837~1596811192837', MathLang;

class LanguageOfLanguages {
  	constructor(props) {
  		if (props.hasOwnProperty('key')) {
  			this.key = props['key'];
  			delete props['key'];
  		} else {
			this._id = this.prefix + LanguageOfLanguages.uuid();
			this._version = Date.now();
		}
		this.nextRes = LoLsResHead;
		LoLsResHead = this;
		var fields = LanguageOfLanguages.mySerializedFields();	
		for (var p in props) { 
    		if (fields.includes(p) && props.hasOwnProperty(p)) {
      			this[p] = props[p]
      		}
      	}
    }
	static mySerializedFields () {
		return ['name','key','description','authors','license','website']
	}
	get serializedFields () {
		return LanguageOfLanguages.mySerializedFields()
	}
	get serialize() {
		return JSON.stringify(this, this.serializedFields, '\t');
	}
	static uuid() {
	  return 'xxxxxxxx-xxxx-4xxx-yxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	  });
	}
    get delimiter() {return '~'}
	get extension() {return ''}
	get filename() {
		var name=this.name.replace(/[^0-9a-z]/gi, '');
		return this.prefix+name+this.delimiter+this.key+this.extension
	}
 	_id = undefined				// prefix character + guid for this LoLs item
 	get id() {return this._id}
	_version = undefined		// Date time stamp number of milliseconds 
								// that have passed since January 1, 1970.
	get version() {return this._version}
	set key(value) {
		var a = value.split(this.delimiter);
		this._id = a[0];
		this._version = Number(a[1]);
	}
	get key() {return this.id + this.delimiter + this.version}
	_name = "Unnamed"
	set name(value) {
		this._name = value;
		this._version = Date.now();
	}
	get name() {return this._name}
	nextRes = undefined
	saved = false;
	description = undefined     // string about this LoLs item
	authors = undefined			// string listing the names of authors
	license = undefined			// string with license for this LoLs item
	website = undefined			// URL to website about this LoLs item
	_age = Date.now()
	get age() {return this._age}
	renewAge() {this._age = Date.now()}
	
	static load(key, callback) {
		var data, lolsClass, 
			lolsClasses = {'L': LoLsLanguage, 'G': LoLsGrammar, 'R': LoLsRuntime};
		LanguageOfLanguages.getResourceFilename(key, (filename) => {
			 if (filename == undefined)
				callback(undefined)
			 else {
//			 	fs.readFile(LoLsResources + filename, (err, data) => {
//			 		if (err)
//			 			callback(undefined)
//			 		else {
var data = fs.readFileSync(LoLsResources + filename);
			 			lolsClass = lolsClasses[filename[0]];
			 			if (lolsClass == undefined)
			 				callback(undefined)
			 			else {
			 				var res=new lolsClass(JSON.parse(data));
			 				res.saved=true;
			 				callback(res);	 				
			 			}
//			 		}
//			 	})
			 }
		})	
	}
	static getResourceFilename(pattern, callback) {
//		fs.readdir(LoLsResources, (err, files) => {
//			if (err)
//				callback(undefined)
//			else {
var files = fs.readdirSync(LoLsResources);
				var matches = files.filter(file => file.search(pattern) >= 0), c=0, p, a;
				for (var i=0; i< matches.length; i++) {
					p = matches[i].split('~');
					p = new Number(p[2]);
					if (p >= c)
						a = matches[i]
				}
				callback(a);
//			}
//		}) 
	}
	isStored(callback) {
		fs.access(LoLsResources + this.filename, fs.F_OK, (err) => { 
			if (err) 
				callback(false)
			else
			  	callback(true)
		})
	}
	store(replace, callback) {
		var writeIfExists = replace == true ? 'w' : 'wx';
		fs.writeFile(LoLsResources + this.filename, this.serialize, 
					{flag: writeIfExists}, callback)
	}
}

class LoLsLanguage extends LanguageOfLanguages {
  	constructor(props) {
  		super(props);
		var fields = LoLsLanguage.mySerializedFields();	
		for (var p in props) 
    		if (fields.includes(p) && props.hasOwnProperty(p))
      			this[p] = props[p]
    }
	static mySerializedFields () {
		return ['pipelineKeys'] 
	}
	get serializedFields () {
		var fields = super.serializedFields;
		return fields.concat(LoLsLanguage.mySerializedFields()) 
	}
	get prefix() {return 'L'}
	_pipeline = []
	set pipelineKeys(keys) {
		var pipe=[], last = undefined, error = '';
      	for (var i= 0; i < keys.length; i++) {
      		getLoLsResource(keys[i], (gram) => {
      			pipe[i] = gram;
      		});
      		if (last != undefined && last.outputType != pipe[i].inputType)
      			error = error+' '(i-1)+':'+last.outputType+' not '+pipe[i].inputType;
      		last = pipe[i];
      	}
      	if (error != '')	
      		return 'Pipeline mismatch '+error
		this._pipeline = pipe;
	}
	get pipelineKeys() {return this._pipeline.map((x) => {return x.key})}
	
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
}

class LoLsGrammar extends LanguageOfLanguages {
  	constructor(props) {
  		super(props);
		var fields = LoLsGrammar.mySerializedFields();	
		for (var p in props) 
    		if (fields.includes(p) && props.hasOwnProperty(p))
      			this[p] = props[p]
    }
	static mySerializedFields () {
		return ['source','startRule',
				'inputType','outputType','rulesSource',
				'metalanguageId','runtimeId']
	}
	get serializedFields () {
		var fields = super.serializedFields;
		return fields.concat(LoLsGrammar.mySerializedFields())
	}
	
    get prefix() {return 'G'}
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
	set rulesSource(value) {
		this._rulesSource = value;
		this.runtime = this._runtime
	}
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
	set metalanguageKey(key) {
		if (MetaLang.key == key)
			return this._metalanguage = MetaLang
		this._metalanguage = MetaLang   // temp needs to load from file
	}
	get metalanguageKey() {
		if (this._metalanguage == undefined)
			return undefined
		return this._metalanguage.key
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
	set runtimeKey(key) {
		if (R.key == key)
			return this.runtime = R
		this.runtime = R				// temp needs to load from file
	}
	get runtimeKey() {return this._runtime.key}	
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
}

class LoLsRuntime extends LanguageOfLanguages {
  	constructor(props) {
  		super(props)
		var fields = LoLsRuntime.mySerializedFields();	
		for (var p in props) 
    		if (fields.includes(p) && props.hasOwnProperty(p))
      			this[p] = props[p]
    }
    static mySerializedFields() {return []}
	evaluate(code) {return eval.call(null, code)}  // uses global context
}

const ResourceCasheSize = 10;
var resourceCashe = new Array(ResourceCasheSize);

getLoLsResource(DefaultRuntimeKey, (lolRes) => {
	if (lolRes == undefined)
		console.log('Unable to load default runtime')
	R = lolRes;
});
console.log(R)
getLoLsResource("Gb7dfe16e-612c-483f-bbe0~1597634061086", (lolRes) => {
	if (lolRes == undefined)
		console.log('Unable to load first grammar for default metalanguage.')
});

getLoLsResource("Gb74fe8f4-dca3-41d4-b0e1~1597634061086", (lolRes) => {
	if (lolRes == undefined)
		console.log('Unable to load second grammar for default metalanguage.')
});

getLoLsResource(DefaultMetalanguageKey, (lolRes) => {
	if (lolRes == undefined)
		console.log('Unable to load default metalanguage.')
	MetaLang = lolRes;
});
MetaLang._pipeline[0]._rules = DefaultMetalanguage.BSOMetaJSParser;
MetaLang._pipeline[1]._rules = DefaultMetalanguage.BSOMetaJSTranslator;
console.log(MetaLang)
getLoLsResource(DefaultMathlanguageKey, (lolRes) => {
	if (lolRes == undefined)
		console.log('Unable to load example Math grammar.')
	MathLang = lolRes;
});
console.log(MathLang) 
var LoLsResHead = undefined;

function getLoLsResource(key, callback) {
	var here = LoLsResHead, last = undefined;
	while (here != undefined && here.key != key) {
		last = here;
		here = last.nextRes;		
	}
	if (here != undefined) {
		last.nextRes=here.nextRes;
		here.nextRes=LoLsResHead;
		LoLsResHead=here;
		callback(here);
		return;
	}
	LanguageOfLanguages.load(key, (lolsRes) => {
		callback(lolsRes);
	});	
}

// get resource from cashe or load resource from file
function old_getLoLsResource(key, callback) {
	var oldest = 0, oldestAge = Date.now();
	for (var i=0; i < ResourceCasheSize; i++) {
		if (resourceCashe[i] != undefined) {
			if (resourceCashe[i].key == key) {
				resourceCashe[i].renewAge();
				callback(resourceCashe[i]);
				return;
			}
			if (resourceCashe[i].age < oldestAge) {
				oldest = i;
				oldestAge = resourceCashe[i].age;
			}
		} else {
			LanguageOfLanguages.load(key, (lolsRes) => {
				resourceCashe[i] = lolsRes;
				if (lolsRes != undefined) 
					lolsRes.renewAge();
				callback(resourceCashe[i]);
			});	
			return;			
		}
	}
	resourceCashe[oldest].store(true, (err) => {
		if (err) {
    			res.statusCode = 400;
    			res.send('page out failed ' + err);
		} else {
			// load resource key into oldest index
			LanguageOfLanguages.load(key, (lolsRes) => {
			resourceCashe[oldest] = lolsRes;
			if (lolsRes != undefined) 
				lolsRes.renewAge();
			callback(resourceCashe[oldest]);			
			})
		}
	})
}

// SERVICES
// return translation of a source object using a language 
app.post('/', (req, res) => {
   	var source=req.body, languageKey=req.query['inLanguage'];
   	getLoLsResource(languageKey, (language) => {
		if (language === undefined) {
			res.send('"' + languageKey + '" not supported.');
			return;
		}
		var ans;	
		try {
			ans = language.translate(source);
		} catch (e) {
			if (e.errorPos==undefined) {
				ans = e.toString() + " at unknown postion " + e.errorPos;		
			} else {
				ans = e.toString() + " at " + e.errorPos + " " +
					  source.substring(e.errorPos);
			}
		};
		res.send('' + ans)
   	});
});

// add a translator source to a grammar  
app.post('/Grammar/', (req, res) => {
   	var source=req.body;
   	var grammarKey=req.query['forGrammar'];
   	getLoLsResource(grammarKey, (grammar) => {
		if (grammar === undefined) {
			res.send('""' + grammarKey + '" grammar not found."'); 
		} else {
			grammar.source = source;
			res.send('' + grammar.status);
		}			
   	});
});

// retrieve a language resource(s) meeting search criteria
app.get('/', (req, res) => {
	fs.readdir(LoLsResources, (err, files) => {
		var pattern=req.body, 
			matches = files.filter(file => file.search(pattern) >= 0);
		res.send(matches);
	})
});

// create a language resource
app.put('/Language/', (req, res) => {
	var language = new LoLsLanguage(req.body);
	if (language != undefined) {
		language.store(false, (err) => {
    		if (err) {
    			res.statusCode = 400;
    			res.send('' + err);
       		} else {
    			res.statusCode = 200;
    			res.send('' + language.filename + ' file saved');
       		}
    	});
	} else {
		res.statusCode = 400;
		res.send('Unable to create Language');
	}
});

// create a grammar resource
app.put('/Grammar/', (req, res) => {
	var grammar = new LoLsGrammar(req.body);
	if (grammar != undefined) {
		grammar.store(false, (err) => {
    		if (err) {
    			res.statusCode = 400;
    			res.send('' + err);
       		} else {
    			res.statusCode = 200;
    			res.send('' + grammar.filename + ' file saved');
       		}
    	});
	} else {
		res.statusCode = 400;
		res.send('Unable to create Grammar');
	}
});

// remove a language or grammar resource
app.delete('/', (req, res) => {
	var filename=req.body;
	fs.unlink(LoLsResources + filename, function (err) { 
		if (err) {
			res.statusCode = 400;
			res.send('' + err)
		} else {
			res.statusCode = 200;
			res.send('Deleted ' + filename);
		};
	});
});

//PORT ENVIRONMENT VARIABLE
const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Listening on port ${port}..`));