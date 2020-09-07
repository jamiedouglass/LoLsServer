const express = require('express');
const app = express();
app.use(express.json());
app.use(express.text());
const fs = require('fs');

const lib = require('./Platform/lib');
const parser = require('./Platform/parser');
const LoLsBootstrap = './LoLsBootstrap/';
const LoLsResources ='./LoLsResources/';
const DefaultMetalanguagePath = LoLsBootstrap + 'OMeta/bs-ometa-js-compiler.js';
var DefaultMetalanguage = require(DefaultMetalanguagePath),
	DefaultMetalanguageKey = 'L28c00bd7-f8f9-4150-bd81~1577865600000', MetaLang,
    DefaultRuntimeKey = 'Ree1df5a3-1dae-4905-adc9~1577865600000', Runtime;

var LoLsResHead = undefined;

function initialize() {
	getLoLsResource(DefaultRuntimeKey, (lolRes) => {
		if (lolRes == undefined)
			console.log('Unable to load default runtime')
		Runtime = lolRes;
	});
	getLoLsResource(DefaultMetalanguageKey, (lolRes) => {
		if (lolRes == undefined)
			console.log('Unable to load default metalanguage.')
		MetaLang = lolRes;
	});
}

function startShutdown() {
	console.log("\nStarting Shutdown...");
	setTimeout(() => {
        console.error('Could not close gracefully, forcefully shutting down');
        process.exit(1);
    }, 10000); 
    // save resources
    saveLoLsResources();
	server.close(() => {
		console.log("Shutdown Complete");
		process.exit(0);
	}); 
}

class LanguageOfLanguages {
  	constructor(props) {
  		if (props.hasOwnProperty('key')) {
  			this.key = props['key'];
  			delete props['key'];
  		} else {
			this._id = this.prefix + LanguageOfLanguages.uuid();
			this._version = Date.now();
		}
		if (props.hasOwnProperty('name')) {
  			this._name = props['name'];
  			delete props['name'];
  		}
		this.nextRes = LoLsResHead;         // add resource for circular references
		LoLsResHead = this;
		var fields = LanguageOfLanguages.mySerializedFields();	
		for (var p in props) { 
    		if (fields.includes(p) && props.hasOwnProperty(p)) {
      			this[p] = props[p]
      		}
      	}
		for (var p in fields) { 
			if (props.hasOwnProperty(p))
      		 	delete props[p];
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
		this._saved = false;		
	}
	get name() {return this._name}
	nextRes = undefined
	_saved = false;
	get saved() {return this._saved}
	description = undefined     // string about this LoLs item
	authors = undefined			// string listing the names of authors
	license = undefined			// string with license for this LoLs item
	website = undefined			// URL to website about this LoLs item
	
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
			 				res._saved=true;
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
			  	callback(this._saved)
		})
	}
	store(replace, callback) {
		var opt = {flag: 'wx'};
		if (replace = true)
			opt.flag = "w";
		if (callback == undefined)
			callback = () => {};
		fs.writeFileSync(LoLsResources+this.filename,this.serialize,opt);
		this._saved = true;
		callback();
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
		this._pipeline=[];
      	for (var i= 0; i < keys.length; i++) {
      		getLoLsResource(keys[i], (resource) => {   // sync operation support?
      			this._pipeline[i] = resource;
      		});
      	}
      	return this.checkPipeline();
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
	checkPipeline() {
		var ans = '';
		for (var i=0; i < this._pipeline.length-1; i++) {
			if (this._pipeline[i].outputType != this._pipeline[i+1].inputType) {
				ans=ans+i+':'+this._pipeline[i].outputType+' not '+
					this._pipeline[i+1].inputType+"; ";
			}
		}
		return ans;
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
      	this.complete();
    }
	static mySerializedFields () {
		return ['source','startRule',
				'inputType','outputType','rulesSource',
				'metalanguageKey','runtimeKey']
	}
	get serializedFields () {
		var fields = super.serializedFields;
		return fields.concat(LoLsGrammar.mySerializedFields())
	}
	
    get prefix() {return 'G'}
    source = undefined 				// source for Grammar
	startRule = undefined			// string key from rules
	inputType = 'text/plain'
	outputType = 'text/javascript'
	grammar(scr, startR, inType, outType) {
		var rScr, r;
		if (inType == undefined)
			inType = 'text/plain';
		if (outType == undefined)
			outType = 'text/javascript';
    	try { 
    		rScr = this._metalanguage.translate(scr);
    	} catch (e) {
			if (e.errorPos == undefined) {
				return e.toString() + " at unknown postion " + e.errorPos;		
			} else {
				return e.toString() + " at " + e.errorPos + 
								" " + src.substring(e.errorPos);
			}
		}
    	try { 
			r = this._runtime.evaluate(rScr)
    	} catch (e) {
			return e.toString() + " evaluating rules to runtime";		
		}
		try {
			if (startR == undefined)
				startR = Object.keys(r)[0]
			if (!r.hasOwnProperty(startR))
				return "missing start rule"
		} catch (e) {
			return "no start rule " + startR
		}
		this.source = scr;
		this.startRule = startR;
		this.inputType = inType;
		this.outType = outType;
		this.rulesSource = rScr;
		this.rules = r;
		return true;
	}
	rulesSource = undefined			// string with sources of rules
	_rules = undefined				// rule name & functions pairs
	_metalanguage = MetaLang		// LoLs metalanguage for this grammar
	set metalanguageKey(key) {
		if (MetaLang != undefined && MetaLang.key == key)
			this._metalanguage = MetaLang
		getLoLsResource(key, (lolRes) => {
			this._metalanguage = lolRes;
		});
	}
	get metalanguageKey() {
		if (this._metalanguage == undefined)
			return undefined
		return this._metalanguage.key
	}
	_runtime = Runtime  					// metalanguage runtime environment
	set runtimeKey(key) {
		if (Runtime != undefined && Runtime.key == key)
			this._runtime = Runtime
		getLoLsResource(key, (lolRes) => {
			this._runtime = lolRes;
		});
	}
	get runtimeKey() {
		if (this._runtime == undefined)
			return undefined
		return this._runtime.key
	}	
	translate(sourceInput) {
		var result = this.isReady();
		if (result != true)					// temp until isReady fixed
			return result;
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
	isReady() {
		if (this.source == undefined)
			return "no source"
		if (this.rulesSource == undefined)
			return "no rules source"
		if (this._rules == undefined)
			return "no rules"
		if (this.startRule == undefined)
			return "no start rule"
		return true
	}
	complete() {
		// Bootstrap grammars for OMeta JS
		if (this.source == "DefaultMetalanguage.BSOMetaJSParser") 
			this._rules = DefaultMetalanguage.BSOMetaJSParser;
		if (this.source == "DefaultMetalanguage.BSOMetaJSTranslator") 
			this._rules = DefaultMetalanguage.BSOMetaJSTranslator;
		if (this._rules != undefined)
			return this.isReady();
		// create from source
		if (this.rulesSource == undefined) {
			return this.grammar(this.source, this.startRule, 
								this.inputType, this.outputType);
		}
		// create from rules source
    	try { 
			this._rules = this._runtime.evaluate(this.rulesSource)
    	} catch (e) {
			return e.toString() + " evaluating rules to runtime";		
		}
		if (this.startRule == undefined)
			this.startRule = Object.keys(this._rules)[0]
		return this.isReady()
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
	get prefix() {return 'R'}
	evaluate(code) {return eval.call(null, code)}  // uses global context
}

// get resource from cashe or load resource from file
function getLoLsResource(key, callback) {
	var here = LoLsResHead, last = undefined;
	while (here != undefined && here.key != key) {
		last = here;
		here = last.nextRes;		
	}
	if (here != undefined) {
		if (last != undefined) {
			last.nextRes=here.nextRes;
			here.nextRes=LoLsResHead;
			LoLsResHead=here;
		}
		callback(here);
		return;
	}
	LanguageOfLanguages.load(key, (lolsRes) => {
		callback(lolsRes);
	});	
}

function saveLoLsResources(force) {
	var here = LoLsResHead;
	while (here != undefined) {
		if (force == true || here.saved == false) {
			here.store(true);
		}
		here = here.nextRes;
	}
}

initialize();

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
			res.send('' + grammar.complete(source, grammar.startRule, 
							 grammar.inputType, grammar.outputType));
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
const server = app.listen(port, () => console.log(`Listening on port ${port}..`));

process.on('SIGTERM', startShutdown);
process.on('SIGINT', startShutdown);