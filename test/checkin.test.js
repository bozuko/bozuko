var print = require('util').debug;
var assert = require('assert');
var qs = require('querystring');
var bozuko_headers = assert.headers;

var id = assert.page_id;

// user the custom headers hack for now so we don't have to log in programmatically
exports['POST /facebook/:id/checkin'] = function(beforeExit) {

    var params = JSON.stringify({
        lat: 42.646261785714,
        lng: -71.303897114286,
        message: "testing"
    });

    bozuko_headers['content-type'] = 'application/json';

    assert.response(Bozuko.app,
        {
            url: '/facebook/'+id+'/checkin',
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
// user the custom headers hack for now so we don't have to log in programmatically
exports['POST /facebook/:id/checkin No User'] = function(beforeExit) {

    var params = JSON.stringify({
        lat: 42.646261785714,
        lng: -71.303897114286,
        message: "testing"
    });

    assert.response(Bozuko.app,
        {
	    url: '/facebook/'+id+'/checkin',
	    headers: {'content-type':'application/json'},
	    method: 'POST',
	    data: params
	},
	{
	    status:401,
	    headers: {'Content-Type': 'application/json'}
	},
	function(res) {
	    var result = JSON.parse(res.body);
	    console.log(result);
	}
    );
};

// user the custom headers hack for now so we don't have to log in programmatically
exports['POST /facebook/:id/checkin No Latitude Longitude'] = function(beforeExit) {

    var params = JSON.stringify({
        message: "testing"
    });

    assert.response(Bozuko.app,
        {
	    url: '/facebook/'+id+'/checkin',
	    headers: bozuko_headers,
	    method: 'POST',
	    data: params
	},
	{
	    status:500,
	    headers: {'Content-Type': 'application/json'}
	},
	function(res) {
	    var result = JSON.parse(res.body);
	    console.log(result);
	}
    );
};

// user the custom headers hack for now so we don't have to log in programmatically
exports['POST /contest/:id/checkin No Latitude Longitude'] = function(beforeExit) {

    var params = JSON.stringify({
        message: "testing"
    });

    assert.response(Bozuko.app,{
		url: '/facebook/'+id+'/checkin',
		headers: bozuko_headers,
		method: 'POST',
		data: params
	},
	{
		status:500,
		headers: {'Content-Type': 'application/json'}
	},
	function(res) {
		var result = JSON.parse(res.body);
		console.log(result);
	});
};