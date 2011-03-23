var print = require('util').debug;
var assert = require('assert');
var bozuko = require('bozuko');
var async = require('async');

var bozuko_headers = assert.headers;

var ok = {status: 200, headers: {'Content-Type': 'application/json'}};

// Step through the app by following links
exports['play a game'] = function(beforeExit) {
    async.reduce([get_root, get_pages, facebook_checkin, play],
        '/api',
        function(link, f, callback) {
            f(link, callback);
        },
        function(err, result){
            console.log("last URI = "+result);
        });
};

var get_root = function(link, callback) {
    assert.response(bozuko.app,
        {url: link},
        ok,
        function(res) {
            var entry_point = JSON.parse(res.body);
            if (!bozuko.validate('entry_point', entry_point)) {
                callback("Error: entry_point didn't validate", link);
            } else {
                callback(null, entry_point.links.pages);
            }
        });
};

var get_pages = function(link, callback) {
    assert.response(bozuko.app,
        {url: link+'/?lat=42.646261785714&lng=-71.303897114286&limit=5&query=owl'},
        ok,
        function(res) {
            var page = JSON.parse(res.body)[0];
            assert.ok(bozuko.validate('page', page));
            callback(null, page.links.facebook_checkin);
        });
};

var facebook_checkin = function(link, callback) {
    var params = JSON.stringify({
        lat: 42.646261785714,
        lng: -71.303897114286,
        message: "Bobby B in da house"
    });

    bozuko_headers['content-type'] = 'application/json';

    assert.response(bozuko.app,
        {url: link,
        method: 'POST',
        headers: bozuko_headers,
        data: params},
        ok,
        function(res) {
            var facebook_checkin_result = JSON.parse(res.body);
            assert.ok(bozuko.validate('facebook_result', facebook_checkin_result));
            callback(null, facebook_checkin_result.links.contest_result);
        });
};

// Play the slots game and check the result
var play = function(link, callback) {
    assert.response(bozuko.app,
        {
            url: link,
            method: 'POST',
            headers: bozuko_headers
        },
        ok,
        function(res) {
            var result = JSON.parse(res.body);
            // assert.ok(bozuko.validate('contest_result', result));
            console.log(result);
        });
};
