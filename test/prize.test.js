var assert = require('assert');
var testsuite = require('./testsuite');

var uid = assert.uid;
var token = assert.token;
var headers = {'content-type': 'application/json'};
var tokstr = "/?token="+token;

exports.setup = function(test) {
    testsuite.setup(test.done);
};

exports['GET /prizes'] = function(test) {
    assert.response(test, Bozuko.app,
	{url: '/prizes'+tokstr, headers: headers},
	{status: 200, headers: {'Content-Type': 'application/json'}},
	function(res) {
	    var prizes = JSON.parse(res.body);
            test.ok(Bozuko.validate('prize', prizes[0]));
            test.done();
        });
};

exports['GET /prizes - active state'] = function(test) {
    assert.response(test, Bozuko.app,
        {url: '/prizes'+tokstr+'&state=active', headers: headers},
        {status: 200, headers: {'Content-Type': 'application/json'}},
        function(res) {
            var prizes = JSON.parse(res.body);
            test.ok(Bozuko.validate('prize', prizes[0]));
            test.done();
        });
};

exports['GET /prizes - bad state'] = function(test) {
    assert.response(test, Bozuko.app,
        {url: '/prizes'+tokstr+'&state=aaaactive'},
        {status: 400, headers: {'Content-Type': 'application/json'}},
        function(res) {
            test.done();
        });
};

exports['GET /prize/:id'] = function(test) {
    assert.response(test, Bozuko.app,
        {url: '/prize/354353453453'+tokstr},
        {status: 200, headers: {'Content-Type': 'application/json'}},
        function(res) {
            test.ok(Bozuko.validate('prize', JSON.parse(res.body)));
            test.done();
        });
};
