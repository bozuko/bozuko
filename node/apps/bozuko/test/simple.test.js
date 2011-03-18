var print = require('util').debug;
var assert = require('assert');
var bozuko = require('bozuko');
var async = require('async');

var user = {
    id: '100001863668743',
    token: '166078836756369%7C81213baf1a427b66698083c8-100001863668743%7CVGHsgIgaHcr9twaMGSzLhctxZe0'
};

var bozuko_headers = {
    'BOZUKO_FB_USER_ID': user.id,
    'BOZUKO_FB_ACCESS_TOKEN' : user.token
};

var ok = {status: 200, headers: {'Content-Type': 'application/json'}};

// Step through the app by following links
exports['play a game'] = function(beforeExit) {
//    async.reduce([get_root, get_pages, facebook_checkin, play],
    async.reduce([get_root, get_pages],
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
        {url: link+'/?lat=42.375&lng=-71.106&limit=5'},
        ok,
        function(res) {
	    var page = JSON.parse(res.body).data[0];
            if (!bozuko.validate('page', page)) {
                callback("Error: page didn't validate", link);
            } else {
                callback(page.links.facebook_checkin);
            }
        });
};

var facebook_checkin = function(link, callback) {
    assert.response(bozuko.app,
        {url: link+'/?lat=42.375&lng=-71.106&message=Bobby B in the house',
        method: 'POST',
        headers: bozuko_headers},
        ok,
        function(res) {
            var facebook_checkin_result = JSON.parse(res.body);
            if (!bozuko.validate('facebook_checkin_result', facebook_checkin_result)) {
                callback("Error: facebook_checkin_result didn't validate", link);
            } else {
                callback(facebook_checkin_result.links.contest_result);
            }
        });

};

// Play the slots game and check the result
var play = function(link, callback) {
    assert.response(bozuko.app,
        {url: links + "/?game=slots", method: 'POST'},
        ok,
        function(res) {
            var result = JSON.parse(res.body);
            if (!bozuko.validate('contest_result', result)) {
                callback("Error: contest_result didn't validate", link);
            } else {
                if (result.links.prize) {
                    console.log("You Won!");
                    callback(result.links.prize);
                }
            }
        });

};
