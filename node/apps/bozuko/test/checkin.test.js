var print = require('util').debug;
var assert = require('assert');
var bozuko = require('bozuko');
var qs = require('querystring');
var bozuko_headers = assert.headers;

// user the custom headers hack for now so we don't have to log in programmatically
exports['POST /contest/:id/entry/facebook/checkin'] = function(beforeExit) {
	
    var params = JSON.stringify({
        lat: 42.646261785714,
        lng: -71.303897114286,
        message: "testing"
    });
	
	bozuko_headers['content-type'] = 'application/json';
	
	assert.response(bozuko.app,
		{
			url: '/contest/'+assert.contest_id+'/entry/facebook/checkin',
			headers: bozuko_headers,
			method: 'POST',
			data: params
		},
		{
			status: 200,
			headers: {'Content-Type': 'application/json'}
		},
		function(res) {
			var result = JSON.parse(res.body);
			console.log(result);
		}
	);
};