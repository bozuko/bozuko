var print = require('util').debug;
var assert = require('assert');
var bozuko = require('bozuko');

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
                        'fan_count', 'checkins', 'games']);
		});

            assert.response(bozuko.app,
		   {url: '/page/'+place.id+'/game'},
		   {status: 404, header: {'Content-Type': 'application/json'}});
    });
};
