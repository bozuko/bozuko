var util = require('util');
var assert = require('assert');
var app = require('../app');



function teardown() {
    if (app.__pending === 0) {
	// Node will not exit the event loop until all external connections are closed!
	// This means we must close the db connections.
	setTimeout(function(){Bozuko.db.conn().disconnect();}, 1);
    }
}

module.exports = {
    
    'GET /pages': function(beforeExit) {
	assert.response(app, 
	    {url: '/pages/'},
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
		teardown();
	    });
    }
 };