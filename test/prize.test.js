var assert = require('assert');
var bozuko = require('bozuko');
var uid = assert.uid;
var bozuko_headers = assert.headers;

exports['GET /prizes'] = function() {
    assert.response(bozuko.app,
	{url: '/prizes', headers: bozuko_headers},
	{status: 200, headers: {'Content-Type': 'application/json'}},
	function(res) {
	    var prizes = JSON.parse(res.body);
            assert.ok(bozuko.validate('prize', prizes[0]));
        });
};

exports['GET /prizes - active state'] = function() {
    assert.response(bozuko.app,
        {url: '/prizes?state=active', headers: bozuko_headers},
        {status: 200, headers: {'Content-Type': 'application/json'}},
        function(res) {
            var prizes = JSON.parse(res.body);
            assert.ok(bozuko.validate('prize', prizes[0]));
        });
};

exports['GET /prizes - bad state'] = function() {
    assert.response(bozuko.app,
        {url: '/prizes?state=aaaactive', headers: bozuko_headers},
        {status: 400, headers: {'Content-Type': 'application/json'}});
};

exports['GET /prize/:id'] = function() {
    assert.response(bozuko.app,
        {url: '/prize/354353453453', headers: bozuko_headers},
        {status: 200, headers: {'Content-Type': 'application/json'}},
        function(res) {
            assert.ok(bozuko.validate('prize', JSON.parse(res.body)));
        });
};
