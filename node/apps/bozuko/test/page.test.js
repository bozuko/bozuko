var print = require('util').debug;
var assert = require('assert');
var bozuko = require('bozuko');

exports['GET first page']  = function(beforeExit) {
    assert.response(bozuko.app, 
        {url: '/pages'},
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
		    });
            });  
};


