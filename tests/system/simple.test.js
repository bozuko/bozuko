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
            test.ok(true);
            var entry_point = JSON.parse(res.body);
            test.ok(Bozuko.validate('entry_point', entry_point));
            pages_link = entry_point.links.pages;
            test.done();
        });
};

exports.get_pages = function(test) {
    assert.response(test, Bozuko.app,
        {url: pages_link+'/?ll=42.646261785714,-71.303897114286'},
        ok,
        function(res) {
            var result = JSON.parse(res.body);
            var page = result.pages[0];
            var valid = Bozuko.validate('page', page);
            test.ok(valid);
            checkin_link = page.links.facebook_checkin;
            favorite_link = page.links.favorite;
            test.done();
        });
};

exports.get_pages_by_bounds = function(test){
    assert.response(test, Bozuko.app,
        {url: pages_link+'/?bounds=42.631243,-71.331739,42.655803,-71.293201&ll=42.646261785714,-71.303897114286'},
        ok,
        function(res) {
            var result = JSON.parse(res.body);
            test.ok( result.pages.length === 3 );
            test.done();
        });
}

exports.favorite_add = function(test) {
    assert.response(test, Bozuko.app,
        {url: favorite_link+'/?token='+token, method:'PUT'},
        ok,
        function(res) {
            var result = JSON.parse(res.body);
            test.ok(Bozuko.validate('favorite_response', result));
            test.ok(result.added);
            test.done();
        });
};

exports.assert_one_fav= function(test) {
    assert.response(test, Bozuko.app,
        {url: pages_link+'/?ll=42.646261785714,-71.303897114286&favorites=true&token='+token},
        ok,
        function(res) {
            var result = JSON.parse(res.body);
            try{
                test.ok(result.pages.length == 1);
            }catch(e){
                console.log(result);
                throw e;
            }
            test.done();
        });
};

exports.favorite_del = function(test) {
    assert.response(test, Bozuko.app,
        {url: favorite_link+'/?token='+token, method:'DELETE'},
        ok,
        function(res) {
            var result = JSON.parse(res.body);
            console.log(result);
            test.ok(Bozuko.validate('favorite_response', result));
            test.ok(result.removed);
            test.done();
        });
};

exports.favorite_toggle = function(test) {
    assert.response(test, Bozuko.app,
        {url: favorite_link+'/?token='+token, method:'POST'},
        ok,
        function(res) {
            var result = JSON.parse(res.body);
            console.log(result);
            test.ok(Bozuko.validate('favorite_response', result));
            test.ok(result.added);
            test.done();
        });
};


exports.favorite_toggle_again = function(test) {
    assert.response(test, Bozuko.app,
        {url: favorite_link+'/?token='+token, method:'POST'},
        ok,
        function(res) {
            var result = JSON.parse(res.body);
            console.log(result);
            test.ok(Bozuko.validate('favorite_response', result));
            test.ok(result.removed);
            test.done();
        });
};

exports.facebook_checkin = function(test) {
    var params = JSON.stringify({
        ll: '42.646261785714,-71.303897114286',
        message: "This place is off the hook!",
        phone_type: phone.type,
        phone_id: phone.unique_id,
        mobile_version: '1.0',
        challenge_response: auth.mobile_algorithms['1.0'](assert.challenge)
    });
    console.log(params);
    assert.response(test, Bozuko.app,
        {url: checkin_link+"/?token="+token,
        method: 'POST',
        headers: headers,
        data: params},
        ok,
        function(res) {
            console.log(res.body);
            var facebook_checkin_result = JSON.parse(res.body);
            test.ok(Bozuko.validate('facebook_result', facebook_checkin_result));
            link = facebook_checkin_result.games[0].links.contest_result;
            test.done();
        });
};

// Play the slots game and check the result
exports.play3times = function(test) {
    var params = JSON.stringify({
        phone_type: phone.type,
        phone_id: phone.unique_id,
        mobile_version: '1.0',
        challenge_response: auth.mobile_algorithms['1.0'](assert.challenge)
    });

    var play = function(callback) {
        assert.response(test, Bozuko.app,
            {
                url: link+"/?token="+token,
                method: 'POST',
                headers: headers,
                data: params
            },
            ok,
            function(res) {
                console.log(res.body);
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
    var params = JSON.stringify({
        phone_type: phone.type,
        phone_id: phone.unique_id,
        mobile_version: '1.0',
        challenge_response: auth.mobile_algorithms['1.0'](assert.challenge)
    });

    assert.response(test, Bozuko.app,
        {
            url: link+"/?token="+token,
            method: 'POST',
            headers: headers,
            data: params
        },
        bad,
        function(res) {
            var result = JSON.parse(res.body);
            test.done();
        }
    );
};
