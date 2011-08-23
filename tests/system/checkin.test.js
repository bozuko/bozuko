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
var bad2 = {status: 403, headers: {'Content-Type': 'application/json; charset=utf-8'}};
var auth;
var ll1 = '29.32855,-81.0579';
var ll2 = '42.650,-71.310';

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

exports.get_pages1 = function(test) {
    assert.response(test, Bozuko.app,
        {url: pages_link+'/?ll='+ll1+'&limit=2'},
        ok,
        function(res) {
            var result = JSON.parse(res.body);
            var page = result.pages[0];
            test.ok(Bozuko.validate('page', page));
            checkin_link = page.links.facebook_checkin;
            favorite_link = page.links.favorite;
            test.done();
        });
};

exports.checkin1 = function(test){
    assert.response(test, Bozuko.app,
        {
            url: checkin_link,
            headers: headers,
            method: 'post',
            data: JSON.stringify({
                ll: ll1,
                token: token,
                phone_type: phone.type,
                phone_id: phone.unique_id,
                mobile_version: '1.0',
                challenge_response: auth.mobile_algorithms['1.0'](assert.challenge,{url:checkin_link})
            })
        },
        ok,
        function(res) {
            console.log(res.body);
            var result = JSON.parse(res.body);
            var wait = Bozuko.cfg('checkin.duration.user', 1000 * 5);
            console.log('Waiting '+wait+'ms to test distance over time' );
            setTimeout(function(){
                test.done();
            }, wait);
        });
};

exports.get_pages2 = function(test) {
    assert.response(test, Bozuko.app,
        {url: pages_link+'/?ll='+ll2+'&limit=2'},
        ok,
        function(res) {
            var result = JSON.parse(res.body);
            var page = result.pages[0];
            test.ok(Bozuko.validate('page', page));
            checkin_link = page.links.facebook_checkin;
            favorite_link = page.links.favorite;
            test.done();
        });
};

exports.checkin2 = function(test){
    assert.response(test, Bozuko.app,
        {
            url: checkin_link,
            headers: headers,
            method: 'post',
            data: JSON.stringify({
                ll: ll2,
                token: token,
                phone_type: phone.type,
                phone_id: phone.unique_id,
                mobile_version: '1.0',
                challenge_response: auth.mobile_algorithms['1.0'](assert.challenge,{url:checkin_link})
            })
        },
        bad2,
        function(res) {
            var result = JSON.parse(res.body);
            console.log(result);
            test.done();
        });
};