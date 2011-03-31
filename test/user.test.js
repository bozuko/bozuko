var print = require('util').debug;
var assert = require('assert');
var uid = assert.uid;
var token = assert.token;
var tokstr = "/?token="+token;

exports['GET /user/login'] = function(beforeExit) {
    assert.response(Bozuko.app,
        {url: '/user/login'},
        {status: 302, headers: {'Content-Type': 'text/html'}});
};

exports['GET /user'] = function(beforeExit) {
    assert.response(Bozuko.app,
	{url: '/user'+tokstr},
	{status: 200, headers: {'Content-Type': 'application/json'}},
	function(res) {
	    var user = JSON.parse(res.body);
            assert.ok(Bozuko.validate('user', user));
	});
};

exports['GET /user/favorites'] = function(beforeExit) {
    assert.response(Bozuko.app,
        {url: '/user/favorites'+tokstr},
        {status: 404});
};


/*exports['GET /user/:id/prizes'] = function(beforeExit) {
    assert.response(Bozuko.app,
	{url: '/user/'+uid+'/prizes'},
	{status: 200, headers: {'Content-Type': 'application/json'}},
	function(res) {
	    var prizes = JSON.parse(res.body);
            prizes.forEach(function(prize) {
                assert.keys(prize, ['state', 'name', 'place', 'win_time']);
                if (prize.state === 'active') {
                    assert.keys(prize, ['expiration_time']);
                } else if (prize.state === 'redeemed') {
                    assert.keys(prize, ['redemption_time']);
                } else if (prize.state === 'expired') {
                    assert.keys(prize, ['expiration_time']);
                }
            });
        });
};*/

