var print = require('util').debug;
var assert = require('assert');
var bozuko = require('bozuko');

exports['GET /user/login'] = function(beforeExit) {
    assert.response(bozuko.app,
        {url: '/user/login'},
        {status: 302, headers: {'Content-Type': 'text/html'}},
        function(res) {
	});
};