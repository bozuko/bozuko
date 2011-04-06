var print = require('util').debug;
var assert = require('assert');
var async = require('async');
var testsuite = require('./testsuite');

var token = assert.token;
var headers = {'content-type': 'application/json'};
var ok = {status: 200, headers: {'Content-Type': 'application/json'}};
var bad = {status: 500, headers: {'Content-Type': 'application/json'}};

exports.setup = function(test) {
    testsuite.setup(test.done);
};

var link = '/api';

exports.get_root = function(test) {
    assert.response(test, Bozuko.app,
        {url: link},
        ok,
        function(res) {
            var entry_point = JSON.parse(res.body);
            test.ok(Bozuko.validate('entry_point', entry_point));
            link = entry_point.links.pages;
            test.done();
        });
};

exports.get_pages = function(test) {
    assert.response(test, Bozuko.app,
        {url: link+'/?lat=42.646261785714&lng=-71.303897114286&query=owl&limit=5'},
        ok,
        function(res) {
            var page = JSON.parse(res.body)[0];
            test.ok(Bozuko.validate('page', page));
            link = page.links.facebook_checkin;
            test.done();
        });
};

exports.facebook_checkin = function(test) {
    var params = JSON.stringify({
        lat: 42.646261785714,
        lng: -71.303897114286,
        message: "Bobby B in da house"
    });

    assert.response(test, Bozuko.app,
        {url: link+"/?token="+token,
        method: 'POST',
        headers: headers,
        data: params},
        ok,
        function(res) {
            var facebook_checkin_result = JSON.parse(res.body);
            test.ok(Bozuko.validate('facebook_result', facebook_checkin_result));
            console.log(res.body);
            link = facebook_checkin_result.games[0].links.contest_result;
            test.done();
        });
};

/*exports.facebook_checkin2 = function(test) {
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
        bad,
        function(res) {
            var facebook_checkin_result = JSON.parse(res.body);
            test.ok(Bozuko.validate('facebook_result', facebook_checkin_result));
            console.log(JSON.stringify(facebook_checkin_result));
            link = facebook_checkin_result.games[0].links.contest_result;
            console.log("link = "+link);
            test.done();
        });
};*/

// Play the slots game and check the result
exports.play3times = function(test) {
    var play = function(callback) {
        assert.response(test, Bozuko.app,
            {
                url: link+"/?token="+token,
                method: 'POST',
                headers: headers
            },
            ok,
            function(res) {
                var result = JSON.parse(res.body);
                callback(null, '');
            }
        );
    };
    async.series([play,play,play], function(err, res) {
        test.done();
    });
};


// Play the slots game and check the result
exports.playError = function(test) {
    assert.response(test, Bozuko.app,
        {
            url: link+"/?token="+token,
            method: 'POST',
            headers: headers
        },
        bad,
        function(res) {
            var result = JSON.parse(res.body);
            test.done();
        }
    );
};
