var print = require('util').debug;
var assert = require('assert');
var async = require('async');

var token = assert.token;
var headers = {'content-type': 'application/json'};
var ok = {status: 200, headers: {'Content-Type': 'application/json'}};
var bad = {status: 500, headers: {'Content-Type': 'application/json'}};

// Step through the app by following links
exports['play a game'] = function(beforeExit) {
    async.reduce([get_root, get_pages, facebook_checkin2,play,play,play,playError],
        '/api',
        function(link, f, callback) {
            f(link, callback);
        },
        function(err, link){
            console.log('finished');
        });
};

var get_root = function(link, callback) {
    assert.response(Bozuko.app,
        {url: link},
        ok,
        function(res) {
            var entry_point = JSON.parse(res.body);
            if (!Bozuko.validate('entry_point', entry_point)) {
                callback("Error: entry_point didn't validate", link);
            } else {
                callback(null, entry_point.links.pages);
            }
        });
};

var get_pages = function(link, callback) {
    assert.response(Bozuko.app,
        {url: link+'/?center=42.646261785714,-71.303897114286&query=owl&limit=5'},
        ok,
        function(res) {
            var page = JSON.parse(res.body)[0];
            assert.ok(Bozuko.validate('page', page));
            callback(null, page.links.facebook_checkin);
        });
};

var facebook_checkin = function(link, callback) {
    var params = JSON.stringify({
        lat: 42.646261785714,
        lng: -71.303897114286,
        message: "Bobby B in da house"
    });

    assert.response(Bozuko.app,
        {url: link+"/?token="+token,
        method: 'POST',
        headers: headers,
        data: params},
        ok,
        function(res) {
            var facebook_checkin_result = JSON.parse(res.body);
            assert.ok(Bozuko.validate('facebook_result', facebook_checkin_result));
            callback(null, link);
        });
};

var facebook_checkin2 = function(link, callback) {
    var params = JSON.stringify({
        lat: 42.646261785714,
        lng: -71.303897114286,
        message: "Bobby B kicking in checkin2!"
    });

    assert.response(Bozuko.app,
        {url: link+"/?token="+token,
        method: 'POST',
        headers: headers,
        data: params},
        ok,
        function(res) {
            var facebook_checkin_result = JSON.parse(res.body);
            assert.ok(Bozuko.validate('facebook_result', facebook_checkin_result));
            callback(null, facebook_checkin_result.games[0].links.contest_result);
        });
};

// Play the slots game and check the result
var play = function(link, callback) {
    assert.response(Bozuko.app,
        {
            url: link+"/?token="+token,
            method: 'POST',
            headers: headers
        },
        ok,
        function(res) {
            var result = JSON.parse(res.body);
            console.log("*** User Just Played ***");
            console.log(result);
            callback(null, link);
        }
    );
};


// Play the slots game and check the result
var playError = function(link, callback) {
    assert.response(Bozuko.app,
        {
            url: link+"/?token="+token,
            method: 'POST',
            headers: headers
        },
        bad,
        function(res) {
            var result = JSON.parse(res.body);
            console.log("*** User Just Played (not enough tokens) ***");
            console.log(result);
            callback(null, link);
        }
    );
};
