var print = require('util').debug;
var assert = require('assert');
var qs = require('querystring');

var id = assert.page_id;
var token = assert.token;
var headers = {'content-type': 'application/json'};
var tokstr = "/?token="+token;

exports['POST /facebook/:id/checkin'] = function(beforeExit) {

    var params = JSON.stringify({
        lat: 42.646261785714,
        lng: -71.303897114286,
        message: "testing"
    });

    assert.response(Bozuko.app, {
        url: '/facebook/'+id+'/checkin'+tokstr,
        headers: headers,
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
    });
};

exports['POST /facebook/:id/checkin No User'] = function(beforeExit) {

    var params = JSON.stringify({
        lat: 42.646261785714,
        lng: -71.303897114286,
        message: "testing"
    });

    assert.response(Bozuko.app, {
	url: '/facebook/'+id+'/checkin',
	headers: headers,
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
    });
};

exports['POST /facebook/:id/checkin No Latitude Longitude'] = function(beforeExit) {

    var params = JSON.stringify({
        message: "testing"
    });

    assert.response(Bozuko.app, {
	url: '/facebook/'+id+'/checkin'+tokstr,
	headers: headers,
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
    });
};

/*exports['POST /facebook/:id/like'] = function(beforeExit) {

    assert.response(Bozuko.app, {
        url: '/facebook/'+id+'/like'+tokstr,
	headers: headers,
	method: 'POST'
    },
    {
        status: 200,
	headers: {'Content-Type': 'application/json'}
    },
    function(res) {
        var result = JSON.parse(res.body);
        console.log(result);
    });
};*/