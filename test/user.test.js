var print = require('util').debug;
var assert = require('assert');
var testsuite = require('./testsuite');
var uid = assert.uid;
var token = assert.token;
var tokstr = "/?token="+token;

exports.setup = function(test) {
    testsuite.setup(test.done);
};
exports['GET /user/login'] = function(test) {
    assert.response(test, Bozuko.app,
        {url: '/user/login'},
        {status: 302, headers: {'Content-Type': 'text/html'}},
        function(res) {
            test.done();
        });
};

exports['GET /user'] = function(test) {
    assert.response(test, Bozuko.app,
	{url: '/user'+tokstr},
	{status: 200, headers: {'Content-Type': 'application/json'}},
	function(res) {
	    var user = JSON.parse(res.body);
            test.ok(Bozuko.validate('user', user));
            test.done();
	});
};

