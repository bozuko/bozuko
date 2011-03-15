var print = require('util').debug;
var assert = require('assert');
var bozuko = require('bozuko');

var uid = "4d79b17bc87bdfae73000003"; // Bobby Bozuko

exports['GET /user/login'] = function(beforeExit) {
    assert.response(bozuko.app,
        {url: '/user/login'},
        {status: 302, headers: {'Content-Type': 'text/html'}});
};

exports['GET /user/:id'] = function(beforeExit) {
    assert.response(bozuko.app,
	{url: '/user/'+uid},
	{status: 200, headers: {'Content-Type': 'application/json'}},
	function(res) {
	    var user = JSON.parse(res.body);
	    assert.eql(uid, user.id);
	    assert.keys(user, ['name', 'first_name', 'last_name', 'gender', 'email', 'img']);
            assert.keys(user.links, ['facebook_login', 'facebook_logout', 'favorites']);
	});
};

/*exports['GET /user/:id/prizes'] = function(beforeExit) {
    assert.response(bozuko.app,
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

