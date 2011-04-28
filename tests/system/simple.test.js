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
var auth, tokens, wins=0, prizes_link, prizes;

exports.setup = function(test) {
    testsuite.setup(test.done);
    auth = Bozuko.require('core/auth');
};

var link = '/api';

exports.get_root = function(test) {
    assert.response(test, Bozuko.app,
        {url: link+'/?token='+token},
        ok,
        function(res) {
            var entry_point = JSON.parse(res.body);
            test.ok(Bozuko.validate('entry_point', entry_point));
            pages_link = entry_point.links.pages;
            prizes_link = entry_point.links.prizes;
            test.done();
        });
};

exports.get_pages = function(test) {
    assert.response(test, Bozuko.app,
        {url: pages_link+'/?ll=42.646261785714,-71.303897114286&token='+token},
        ok,
        function(res) {
            var result = JSON.parse(res.body);
            var page = result.pages[0];
            var valid = Bozuko.validate('page', page);
            test.ok(valid);
            checkin_link = page.links.facebook_checkin;
            game_state_link = page.games[0].game_state.links.game_state;
            favorite_link = page.links.favorite;
            test.done();
        });
};

exports.get_pages_by_bounds = function(test){
    assert.response(test, Bozuko.app,
        {url: pages_link+'/?bounds=42.631243,-71.331739,42.655803,-71.293201&ll=42.646261785714,-71.303897114286&token='+token},
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

exports.check_game_state = function(test){
    console.log(game_state_link);
    assert.response(test, Bozuko.app,
        {url: game_state_link+'/?token='+token, method:'GET'},
        ok,
        function(res) {
            var result = JSON.parse(res.body);
            console.log(result);
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
    assert.response(test, Bozuko.app,
        {url: checkin_link+"/?token="+token,
        method: 'POST',
        headers: headers,
        data: params},
        ok,
        function(res) {
            var facebook_checkin_result = JSON.parse(res.body);
            test.ok(Bozuko.validate('facebook_result', facebook_checkin_result));
            tokens = facebook_checkin_result.games[0].game_state.user_tokens;
            test.ok(tokens===3, 'did not get the right amount of tokens from checkin: '+tokens);
            link = facebook_checkin_result.games[0].game_state.links.game_result;
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
                var result = JSON.parse(res.body);
                console.log(result);
                test.ok( --tokens === result.game_state.user_tokens);
                if( tokens > 0 ){
                    test.ok( typeof result.game_state.links.game_result == 'string' );
                }
                // we also want to see if we won    
                if( result.win ) wins++;
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


// Play the slots game and check the result
exports.checkin_again = function(test) {
    var params = JSON.stringify({
        ll: '42.646261785714,-71.303897114286',
        message: "Don't let me checkin again",
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
        {status: 403, headers: {'Content-Type': 'application/json; charset=utf-8'}},
        function(res) {
            var facebook_checkin_result = JSON.parse(res.body);
            console.log(facebook_checkin_result)
            test.done();
        });
};



// Play the slots game and check the result
exports.get_state_again = function(test) {
    var params = JSON.stringify({
        phone_type: phone.type,
        phone_id: phone.unique_id,
        mobile_version: '1.0',
        challenge_response: auth.mobile_algorithms['1.0'](assert.challenge)
    });
    assert.response(test, Bozuko.app,
        {url: game_state_link+"/?token="+token,
        method: 'GET'},
        ok,
        function(res) {
            var game_state = JSON.parse(res.body);
            test.ok( game_state.button_enabled == false, 'Out of tokens, need to wait till next entry' );
            // lets print the next time
            var date = new Date( Date.parse( game_state.next_enter_time ) );
            var now = new Date();
            // set timeout
            var ms = date.getTime() - now.getTime();
            var countdown = Math.round(ms/1000)+1;
            console.log( date.getTime() - now.getTime() );
            var interval = setInterval( function(){
                console.log(--countdown);
            }, 1000);
            console.log('Wait 5 seconds before next checkin');
            var timeout = setTimeout(function(){
                clearInterval( interval );
                test.done();
            }, (date.getTime() - now.getTime()) + 1000);
        });
};

exports.get_next_entry_state = function(test){
    assert.response(test, Bozuko.app,
        {url: game_state_link+"/?token="+token,
        method: 'GET'},
        ok,
        function(res) {
            var game_state = JSON.parse(res.body);
            var date = new Date( Date.parse( game_state.next_enter_time ) );
            var now = new Date();
            test.ok( game_state.button_enabled === true, 'Button enable again');
            test.ok( game_state.button_action === 'enter', 'Button action is enter');
            test.ok( typeof game_state.links.game_entry === 'string', 'we have an entry link');
            
            // lets print the next time
            test.done();
        });
};

exports.do_next_entry = function(test){
    var params = JSON.stringify({
        ll: '42.646261785714,-71.303897114286',
        message: "Still here bitches!",
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
            tokens = facebook_checkin_result.games[0].game_state.user_tokens;
            test.done();
        });
};

exports.play_3more = function(test){
    exports.play3times(test);
};

exports.check_prizes = function(test){
    assert.response(test, Bozuko.app,
        {url: prizes_link+'/?token='+token},
        ok,
        function(res) {
            var result = JSON.parse(res.body);
            test.ok( result.prizes.length === wins, 'Correct number of prizes' );
            prizes = result.prizes;
            test.done();
        });
}

exports.check_prize = function(test){
    
    if( wins == 0 ){
        console.log('holy crap, you lost! run again to test /prize');
        return test.done();
    }
    
    // lets get the prize link
    var prize_link = prizes[0].links.prize;
    
    console.log(prize_link);
    
    assert.response(test, Bozuko.app,
        {url: prize_link+'/?token='+token},
        ok,
        function(res) {
            var result = JSON.parse(res.body);
            console.log(result);
            test.done();
        });
}
