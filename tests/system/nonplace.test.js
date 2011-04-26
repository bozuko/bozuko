var print = require('util').debug;
var assert = require('assert');
var async = require('async');
var testsuite = require('./config/testsuite');

var token = assert.token;
var challenge = assert.challenge;
var phone = assert.phone;
var headers = {'content-type': 'application/json'};
var ok = {status: 200, headers: {'Content-Type': 'application/json; charset=utf-8'}};
var bad = {status: 500, headers: {'Content-Type': 'application/json; charset=utf-8'}};
var auth;
var ll = '29.32855,-81.0579';

exports.setup = function(test) {
    testsuite.setup(test.done);
    auth = Bozuko.require('core/auth');
};

var link = '/api';

exports.get_root = function(test) {
    assert.response(test, Bozuko.app,
        {url: link},
        ok,
        function(res) {
            var entry_point = JSON.parse(res.body);
            test.ok(Bozuko.validate('entry_point', entry_point));
            pages_link = entry_point.links.pages;
            test.done();
        });
};

exports.get_pages = function(test) {
    assert.response(test, Bozuko.app,
        {url: pages_link+'/?ll='+ll+'&limit=2'},
        ok,
        function(res) {
            var result = JSON.parse(res.body);
            var page = result.pages[0];
            console.log(page.location);
            test.ok(Bozuko.validate('page', page));
            checkin_link = page.links.facebook_checkin;
            favorite_link = page.links.favorite;
            test.done();
        });
};

exports.facebook_checkin = function(test) {
    var params = JSON.stringify({
        ll: ll,
        message: "This place is off the hook!",
        phone_type: phone.type,
        phone_id: phone.unique_id,
        mobile_version: '1.0',
        challenge_response: auth.mobile_algorithms['1.0'](assert.challenge)
    });
    
    assert.response(test, Bozuko.app,
        {url: checkin_link+"/?token="+token,
        method: 'POST',
        headers: headers,
        data: params},
        ok,
        function(res) {
            var facebook_checkin_result = JSON.parse(res.body);
            console.log(facebook_checkin_result);
            test.ok(Bozuko.validate('facebook_result', facebook_checkin_result));
            link = facebook_checkin_result.games[0].links.contest_result;
            test.done();
        });
};
