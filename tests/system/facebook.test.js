var print = require('util').debug;
var assert = require('assert');
var qs = require('querystring');
var testsuite = require('./config/testsuite');

var id = assert.fbpage_id;
var token = assert.token;
var headers = {'content-type': 'application/json'};
var tokstr = "/?token="+token;

exports.setup = function(test) {
    testsuite.setup(test.done);
};

/*
 *  Working facebook checkin is tested in simple.test.js
 *  Testing it again here would break simple due to checkin timing constraints and ordering of tests.
 *
 */

exports['POST /facebook/:id/checkin No User'] = function(test) {

    var params = JSON.stringify({
        lat: 42.646261785714,
        lng: -71.303897114286,
        message: "testing"
    });

    assert.response(test,Bozuko.app, {
		url: '/facebook/'+id+'/checkin',
		headers: headers,
		method: 'POST',
		data: params
		},
		{
			status:401,
			headers:  {'Content-Type': 'application/json; charset=utf-8'}
		},
		function(res) {
			var result = JSON.parse(res.body);
			test.done();
		});
};

exports['POST /facebook/:id/checkin No Latitude Longitude'] = function(test) {

    var params = JSON.stringify({
        message: "testing"
    });

    assert.response(test,Bozuko.app, {
		url: '/facebook/'+id+'/checkin'+tokstr,
		headers: headers,
		method: 'POST',
		data: params
		},
		{
			status:400,
			headers: {'Content-Type': 'application/json; charset=utf-8'}
		},
		function(res) {
			console.log(res.body);
			var result = JSON.parse(res.body);
			console.log(result);
			test.done();
		});
};
