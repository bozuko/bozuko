var print = require('util').debug;
var assert = require('assert');
var bozuko = require('bozuko');

var uid = "4d79b18793b597aa73000007"; // Bobby Bozuko

var user = {
    id: '100001863668743',
    token: '166078836756369%7C81213baf1a427b66698083c8-100001863668743%7CVGHsgIgaHcr9twaMGSzLhctxZe0'
};

var bozuko_headers = {
    'BOZUKO_FB_USER_ID': user.id,
    'BOZUKO_FB_ACCESS_TOKEN' : user.token
};

exports['GET /user/login'] = function(beforeExit) {
    assert.response(bozuko.app,
        {url: '/user/login'},
        {status: 302, headers: {'Content-Type': 'text/html'}});
};

// user the custom headers hack for now so we don't have to log in programmatically
exports['GET /user/:id'] = function(beforeExit) {
    assert.response(bozuko.app,
	{url: '/user/'+uid, headers: bozuko_headers},
	{status: 200, headers: {'Content-Type': 'application/json'}},
	function(res) {
	    var user = JSON.parse(res.body);
	    assert.eql(uid, user.id);
	    assert.keys(user, ['name', 'first_name', 'last_name', 'gender', 'email', 'img']);
            assert.keys(user.links, ['facebook_login', 'facebook_logout', 'favorites']);
	});
};



exports['GET /user/:id/favorites'] = function(beforeExit) {
    assert.response(bozuko.app,
        {url: '/user/'+uid+'/favorites', headers: bozuko_headers},
        {status: 200});
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

