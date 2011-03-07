var print = require('util').debug;
var assert = require('assert');
var bozuko = require('bozuko');

var fake_id = 'fake-id';

exports['GET /user/login'] = function(beforeExit) {
    assert.response(bozuko.app,
        {url: '/user/login'},
        {status: 302, headers: {'Content-Type': 'text/html'}},
        function(res) {
	});
};

exports['GET /user/:id'] = function(beforeExit) {
    assert.response(bozuko.app,
	{url: '/user/'+fake_id},
	{status: 200, headers: {'Content-Type': 'application/json'}},
	function(res) {
	    var user = JSON.parse(res.body);
	    assert.eql(fake_id, user.id);
	    assert.keys(user, ['name', 'first_name', 'last_name', 'gender', 'email', 'picture',
	        'facebook_id', 'can_manage_pages']);
	});
};

exports['GET /user/:id/prizes'] = function(beforeExit) {
    assert.response(bozuko.app,
	{url: '/user/'+fake_id+'/prizes'},
	{status: 200, headers: {'Content-Type': 'application/json'}},
	function(res) {
	    var prizes = JSON.parse(res.body);
            prizes.foreach(function(prize) {
                prize
            });
	    assert.keys(prizes, ['active', 'redeemed', 'expired']);
	    assert.eql(prizes.active[0].state, 'active');
	    assert.keys(prizes.active[0], ['name', 'place', 'win_time', 'expiration_time']);
	    assert.eql(prizes.redeemed[0].state, 'redeemed');
	    assert.keys(prizes.redeemed[0], ['name', 'place', 'win_time', 'redemption_time']);
	    assert.eql(prizes.expired[0].state, 'expired');
	    assert.keys(prizes.expired[0], ['name', 'place', 'win_time', 'expiration_time']);
	});
};
