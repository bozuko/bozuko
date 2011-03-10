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

var checkin_and_play = function(checkin_url, contest_url) {
    print(checkin_url);
    assert.response(bozuko.app, {
        url: checkin_url,
        method: 'POST',
        headers: bozuko_headers},
	{status: 200},
        function(res) {
            assert.response(bozuko.app,
                {url: contest_url},
                {status: 200, header: {'Content-Type': 'application/json'}});
        });
};

// Go through the app by following links
exports['play'] = function(beforeExit) {

    // GET /pages
    assert.response(bozuko.app,
	{url: '/pages/?lat=42.375&lng=-71.106&limit=5'},
	{status: 200, headers: {'Content-Type': 'application/json'}},
	function(res) {
	    var place = JSON.parse(res.body).data[0];
            assert.keys(place, ['id', 'name', 'category', 'location', 'games']);
            assert.keys(place.location, ['latitude', 'longitude']);

            // GET the first page
            assert.response(bozuko.app,
                {url: place.links.page},
	        {status: 200, headers: {'Content-Type': 'application/json'}},
	        function(res) {
	            var page = JSON.parse(res.body);
                    assert.keys(page, ['id', 'name', 'picture', 'link', 'category', 'location',
                        'fan_count', 'checkins', 'games']);
                    assert.keys(page.games[0], ['id', 'name', 'icon', 'description', 'prize']);

                    checkin_and_play(page.links.checkins, page.links.contest);
		});
    });
};
