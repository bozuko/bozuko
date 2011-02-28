var print = require('util').debug;
var assert = require('assert');
var app = require('../app');
var btest = require('../btest');

function start() {
    btest.export_test('GET the first page returned from /pages', exports, function(beforeExit) {
        assert.response(app, 
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

		assert.response(app, 
//		    {url: '/page/'+place.id},
                    {url: '/pages'},
		    {status: 200, headers: {'Content-Type': 'application/json'}},
	            function(res) {
			btest.done();
		    });
            });  
	});
}

btest.setup_server(app, start);

