const lib = require('../../Platform/lib');
const BSJSParser = require('./bs-js-compiler');
const BSOMetaParser = require('./bs-ometa-compiler');

{BSOMetaJSParser=lib.objectThatDelegatesTo(BSJSParser.BSJSParser,{
"srcElem":function(){var $elf=this,_fromIdx=this.input.idx,r;return this._or((function(){return (function(){this._apply("spaces");r=this._applyWithArgs("foreign",BSOMetaParser.BSOMetaParser,'grammar');this._apply("sc");return r}).call(this)}),(function(){return BSJSParser.BSJSParser._superApplyWithArgs(this,'srcElem')}))}});BSOMetaJSTranslator=lib.objectThatDelegatesTo(BSJSParser.BSJSTranslator,{
"Grammar":function(){var $elf=this,_fromIdx=this.input.idx;return this._applyWithArgs("foreign",BSOMetaParser.BSOMetaTranslator,'Grammar')}})}

exports.BSOMetaJSParser = BSOMetaJSParser;
exports.BSOMetaJSTranslator = BSOMetaJSTranslator;