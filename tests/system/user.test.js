var print = require('util').debug;
var assert = require('assert');
var testsuite = require('./config/testsuite');

var uid = assert.uid;
var token = assert.token;
var phone = assert.phone;
var tokstr = "/?token="+token;

exports.setup = function(test) {
    testsuite.setup(test.done);
};

// This only verifies a redirect to facebook and does not exercise login logic.
// We don't want to hit facebook oauth everytime we run these tests. Maybe that should be a
// separate test module in manual_tests.
exports['GET /user/login/facebook'] = function(test) {
    assert.response(test, Bozuko.app,
        {url: '/user/login/facebook/'},
        {status: 302, headers: {'Content-Type': 'text/html'}},
        function(res) {
            console.log(res.body);
            test.done();
        });
};

// This only verifies a redirect to foursquare and does not exercise login logic.
// We don't want to hit facebook oauth everytime we run these tests. Maybe that should be a
// separate test module in manual_tests.
exports['GET /user/login/foursquare'] = function(test) {
    assert.response(test, Bozuko.app,
        {url: '/user/login/foursquare/'},
        {status: 302, headers: {'Content-Type': 'text/html'}},
        function(res) {
            console.log(res.body);
            test.done();
        });
};

exports['GET /user'] = function(test) {
    assert.response(test, Bozuko.app,
	{url: '/user'+tokstr},
	{status: 200, headers: {'Content-Type': 'application/json; charset=utf-8'}},
	function(res) {
	    var user = JSON.parse(res.body);
		test.ok(Bozuko.validate('user', user));
		test.ok( user.challenge != undefined );
		test.done();
	});
};

