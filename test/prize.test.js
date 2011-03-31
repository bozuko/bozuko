var assert = require('assert');

var uid = assert.uid;
var token = assert.token;
var headers = {'content-type': 'application/json'};
var tokstr = "/?token="+token;

exports['GET /prizes'] = function() {
    assert.response(Bozuko.app,
	{url: '/prizes'+tokstr, headers: headers},
	{status: 200, headers: {'Content-Type': 'application/json'}},
	function(res) {
	    var prizes = JSON.parse(res.body);
            assert.ok(Bozuko.validate('prize', prizes[0]));
        });
};

exports['GET /prizes - active state'] = function() {
    assert.response(Bozuko.app,
        {url: '/prizes'+tokstr+'&state=active', headers: headers},
        {status: 200, headers: {'Content-Type': 'application/json'}},
        function(res) {
            var prizes = JSON.parse(res.body);
            assert.ok(Bozuko.validate('prize', prizes[0]));
        });
};

exports['GET /prizes - bad state'] = function() {
    assert.response(Bozuko.app,
        {url: '/prizes'+tokstr+'&state=aaaactive'},
        {status: 400, headers: {'Content-Type': 'application/json'}});
};

exports['GET /prize/:id'] = function() {
    assert.response(Bozuko.app,
        {url: '/prize/354353453453'+tokstr},
        {status: 200, headers: {'Content-Type': 'application/json'}},
        function(res) {
            assert.ok(Bozuko.validate('prize', JSON.parse(res.body)));
        });
};
