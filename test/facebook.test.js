var print = require('util').debug;
var assert = require('assert');
var bozuko = require('bozuko');
var qs = require('querystring');
var bozuko_headers = assert.headers;

var id = assert.page_id;

// use the custom headers hack for now so we don't have to log in programmatically
exports['POST /facebook/:id/checkin'] = function(beforeExit) {

    var params = JSON.stringify({
        lat: 42.646261785714,
        lng: -71.303897114286,
        message: "testing"
    });

    bozuko_headers['content-type'] = 'application/json';

    assert.response(bozuko.app,
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
// use the custom headers hack for now so we don't have to log in programmatically
exports['POST /facebook/:id/checkin No User'] = function(beforeExit) {

    var params = JSON.stringify({
        lat: 42.646261785714,
        lng: -71.303897114286,
        message: "testing"
    });

    assert.response(bozuko.app,
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

// use the custom headers hack for now so we don't have to log in programmatically
exports['POST /facebook/:id/checkin No Latitude Longitude'] = function(beforeExit) {

    var params = JSON.stringify({
        message: "testing"
    });

    assert.response(bozuko.app,
        {
	    url: '/facebook/'+id+'/checkin',
	    headers: bozuko_headers,
	    method: 'POST',
	    data: params
	},
	{
	    status:400,
	    headers: {'Content-Type': 'application/json'}
	},
	function(res) {
	    var result = JSON.parse(res.body);
	    console.log(result);
	}
    );
};

// use the custom headers hack for now so we don't have to log in programmatically
exports['POST /facebook/:id/like'] = function(beforeExit) {

    bozuko_headers['content-type'] = 'application/json';

    assert.response(bozuko.app,
        {
            url: '/facebook/'+id+'/like',
	    headers: bozuko_headers,
	    method: 'POST'
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