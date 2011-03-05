var print = require('util').debug;
var assert = require('assert');
var bozuko = require('bozuko');

var user = {
    id: '100001863668743',
    token: '166078836756369%7C81213baf1a427b66698083c8-100001863668743%7CVGHsgIgaHcr9twaMGSzLhctxZe0'
};

var bozuko_headers = {
    'BOZUKO_FB_USER_ID': user.id,
    'BOZUKO_FB_ACCESS_TOKEN' : user.token
};

var checkin_and_play = function(place_id, contest_id) {
    assert.response(bozuko.app, {
        url: '/page/'+place_id+'/checkin',
        method: 'POST',
        headers: bozuko_headers},
	{status: 200},
        function(res) {
            assert.response(bozuko.app,
                {url: '/contest/'+contest_id},
                {status: 200, header: {'Content-Type': 'application/json'}});
        });
};

exports['Get page']  = function(beforeExit) {

    assert.response(bozuko.app,
	{url: '/pages/?lat=42.375&lng=-71.106&limit=5'},
	{status: 200, headers: {'Content-Type': 'application/json'}},
	function(res) {
	    var place = JSON.parse(res.body).data[0];
            assert.keys(place, ['id', 'name', 'category', 'location', 'games']);
            assert.keys(place.location, ['latitude', 'longitude']);

            assert.response(bozuko.app,
                {url: '/page/'+place.id},
	        {status: 200, headers: {'Content-Type': 'application/json'}},
	        function(res) {
	            var page = JSON.parse(res.body);
                    assert.keys(page, ['id', 'name', 'picture', 'link', 'category', 'location',
                        'fan_count', 'checkins', 'contests']);
                    assert.keys(page.contests[0], ['id', 'name', 'icon', 'description', 'prize']);
                    checkin_and_play(place.id, page.contests[0].id);
		});
    });
};
