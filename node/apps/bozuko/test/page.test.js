var print = require('util').debug;
var assert = require('assert');
var bozuko = require('bozuko');

exports['Get page']  = function(beforeExit) {

    assert.response(bozuko.app,
	{url: '/pages/?lat=42.375&lng=-71.106&limit=5'},
	{status: 200, headers: {'Content-Type': 'application/json'}},
	function(res) {
	    var place = JSON.parse(res.body).data[0];
		assert.ok('name' in place);
		assert.ok('category' in place);
		assert.ok('location' in place);
		assert.ok('latitude' in place.location);
		assert.ok('longitude' in place.location);
		assert.ok('id' in place);
		assert.ok('games' in place);

		assert.response(bozuko.app,
		    {url: '/page/'+place.id},
		    {status: 200, headers: {'Content-Type': 'application/json'}},
	            function(res) {
			var page = JSON.parse(res.body);
			assert.ok('id' in page);
			assert.ok('name' in page);
			assert.ok('picture' in page);
			assert.ok('link' in page);
			assert.ok('category' in page);
			// assert.ok('is_community_page' in page); - sometimes this isn't sent
			assert.ok('location' in page);
			assert.ok('latitude' in page.location);
			assert.ok('longitude' in page.location);
			assert.ok('fan_count' in page);
			assert.ok('checkins' in page);
			assert.ok('games' in page);
			assert.ok('id' in page.games[0]);
			assert.ok('icon' in page.games[0]);
			assert.ok('name' in page.games[0]);
			assert.ok('prize' in page.games[0]);
		    });

	       assert.response(bozuko.app,
		   {url: '/page/'+place.id+'/game'},
		   {status: 200, header: {'Content-Type': 'application/json'}},
		   function(res) {
		       assert.eql({success: false}, JSON.parse(res.body));
		   });
    });
};


