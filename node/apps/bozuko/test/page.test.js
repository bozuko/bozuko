var print = require('util').debug;
var assert = require('assert');
var btest = require('../btest');

function run(server) {
    btest.export_test(server, 'GET first page', exports, function(beforeExit) {
        assert.response(server, 
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

		assert.response(server, 
		    {url: '/page/'+place.id},
                    {url: '/pages'},
		    {status: 200, headers: {'Content-Type': 'application/json'}},
	            function(res) {
			btest.done(server);
		    });
            });  
	});
}

btest.setup_app(run);

