const http = require('http');
const lib = require('./lib');
const parser=require('./parser');

var M = lib.objectThatDelegatesTo(parser.OMeta, {
  number: function() {
            return this._or(function() {
                              var n = this._apply("number"),
                                  d = this._apply("digit")
                              return n * 10 + d.digitValue()
                            },
                            function() {
                              var d = this._apply("digit")
                              return d.digitValue()
                            }
                           )
          }
});
var ans=M.match("123456789", "number");

http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('LoLs Parse is ' + ans);
}).listen(8080);