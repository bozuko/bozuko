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
var auth, tokens, wins=0, prizes_link, game_entry_link, prizes, win_results = [];

exports.setup = function(test) {
    testsuite.setup(test.done);
    auth = Bozuko.require('core/auth');
};

var link = '/api';

exports['get_root'] = function(test) {
    assert.response(test, Bozuko.app,
        {url: link+'/?token='+token},
        ok,
        function(res) {
            
            console.log(res.body);
            
            var entry_point = JSON.parse(res.body);
            
            
            test.ok(Bozuko.validate('entry_point', entry_point));
            pages_link = entry_point.links.pages;
            prizes_link = entry_point.links.prizes;
            test.done();
        });
};
exports['page tests'] = {
    

    'default search' : function(test) {
        assert.response(test, Bozuko.app,
            {url: pages_link+'/?ll=42.646261785714,-71.303897114286&token='+token},
            ok,
            function(res) {
                var result = JSON.parse(res.body);
                var page = result.pages[0];
                var valid = Bozuko.validate('page', page);
                test.ok(valid);
                console.log(page.games[0]);
                checkin_link = page.links.facebook_checkin;
                like_link = page.links.facebook_like;
                game_state_link = page.games[0].game_state.links.game_state;
                game_entry_link = page.games[0].game_state.links.game_entry;
                // check for list_message
                
                test.ok( page.games[0].list_message != null, 'No list message');
                favorite_link = page.links.favorite;
                test.done();
            });
    },
    
    'get page by bounds' : function(test){
        assert.response(test, Bozuko.app,
            {url: pages_link+'/?bounds=42.631243,-71.331739,42.655803,-71.293201&ll=42.646261785714,-71.303897114286&token='+token},
            ok,
            function(res) {
                var result = JSON.parse(res.body);
                test.ok( result.pages.length === 3 );
                test.done();
            });
    }
};

exports['favorite tests'] = {
    'add' : function(test) {
        assert.response(test, Bozuko.app,
            {url: favorite_link+'/?token='+token, method:'PUT'},
            ok,
            function(res) {
                var result = JSON.parse(res.body);
                test.ok(Bozuko.validate('favorite_response', result));
                test.ok(result.added);
                test.done();
            });
    },
    
    'check for one favorite' : function(test){
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
    },
    
    'delete a favorite' : function(test) {
        assert.response(test, Bozuko.app,
            {url: favorite_link+'/?token='+token, method:'DELETE'},
            ok,
            function(res) {
                var result = JSON.parse(res.body);
                test.ok(Bozuko.validate('favorite_response', result));
                test.ok(result.removed);
                test.done();
            });
    },
    
    'toggle a favorite' : function(test) {
        assert.response(test, Bozuko.app,
            {url: favorite_link+'/?token='+token, method:'POST'},
            ok,
            function(res) {
                var result = JSON.parse(res.body);
                
                console.log('favorite_toggle', result);
                
                test.ok(Bozuko.validate('favorite_response', result));
                test.ok(result.added);
                test.done();
            });
    },
    
    'toggle a favorite back' : function(test) {
        assert.response(test, Bozuko.app,
            {url: favorite_link+'/?token='+token, method:'POST'},
            ok,
            function(res) {
                var result = JSON.parse(res.body);
                test.ok(Bozuko.validate('favorite_response', result));
                test.ok(result.removed);
                test.done();
            });
    }
};

exports['game tests'] = {
    'check for game state' : function(test){
        assert.response(test, Bozuko.app,
            {url: game_state_link+'/?token='+token, method:'GET'},
            ok,
            function(res) {
                var result = JSON.parse(res.body);
                console.log(result.button_text);
                // test.ok(result.button_text == 'Check in to Play', 'Button text is wrong');
                test.done();
            });
    },
    
    'like a page' : function(test){
        var params = JSON.stringify({
            ll: '42.646261785714,-71.303897114286',
            phone_type: phone.type,
            phone_id: phone.unique_id,
            mobile_version: '1.0',
            challenge_response: auth.mobile_algorithms['1.0'](assert.challenge)
        });
        
        if( !like_link ) return test.done();
        
        return assert.response(test, Bozuko.app, {
            url: like_link+'/?token='+token,
            method: 'POST',
            headers: headers,
            data: params
        }, bad, function(res){
            console.log(JSON.parse(res.body));
            return test.done();
        });
    },
    
    
    'attempt a game entry' : function(test) {
        
        var params = JSON.stringify({
            ll: '42.646261785714,-71.303897114286',
            message: "This place is off the hook!",
            phone_type: phone.type,
            phone_id: phone.unique_id,
            mobile_version: '1.0',
            challenge_response: auth.mobile_algorithms['1.0'](assert.challenge)

        });
        
        assert.response(test, Bozuko.app,
            {url: game_entry_link+"/?token="+token,
            method: 'POST',
            headers: headers,
            data: params},
            ok,
            function(res) {
                var game_states = JSON.parse(res.body);
                console.log(game_states);
                test.ok(Bozuko.validate(['game_state'], game_states));
                tokens = game_states[0].user_tokens;
                test.ok(tokens===3, 'did not get the right amount of tokens from checkin: '+tokens);
                link = game_states[0].links.game_result;
                test.done();
            });
    },
    
    // Play the slots game and check the result
    'play 3 times' : function(test) {
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
                    if( result.win ){
                        win_results.push(result);
                        wins++;
                    }
                    callback(null, '');
                }
            );
        };
        async.series([play,play,play], function(err, res) {
            test.done();
        });
    },
    
    // Play the slots game and check the result
    'play the game one to many times' : function(test) {
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
    },
    
    // Play the slots game and check the result
    'try to checkin again, too close to the last one': function(test) {
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
    },
    
    // Play the slots game and check the result
    'get the game state again' : function(test) {
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
    },
    
    
    'get the next entry state' : function(test){
        assert.response(test, Bozuko.app,
            {url: game_state_link+"/?token="+token,
            method: 'GET'},
            ok,
            function(res) {
                var game_state = JSON.parse(res.body);
                var date = new Date( Date.parse( game_state.next_enter_time ) );
                var now = new Date();
                console.log(game_state);
                test.ok( game_state.button_enabled === true, 'Button enable again');
                test.ok( game_state.button_action === 'enter', 'Button action is enter');
                // test.ok( game_state.button_text === 'Play Again', 'Button text is wrong');
                test.ok( typeof game_state.links.game_entry === 'string', 'we have an entry link');
                
                // lets print the next time
                test.done();
            });
    },
    
    'try a facebook checkin (fail, too soon)' : function(test){
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
            {status: 403, headers: {'Content-Type': 'application/json; charset=utf-8'}},
            function(res) {
                var game_states = JSON.parse(res.body);
                console.log(game_states);
                test.done();
            });
    },
    
    'enter game again' : function(test){
        var params = JSON.stringify({
            ll: '42.646261785714,-71.303897114286',
            message: "Still here bitches!",
            phone_type: phone.type,
            phone_id: phone.unique_id,
            mobile_version: '1.0',
            challenge_response: auth.mobile_algorithms['1.0'](assert.challenge)
        });
        assert.response(test, Bozuko.app,
            {url: game_entry_link+"/?token="+token,
            method: 'POST',
            headers: headers,
            data: params},
            ok,
            function(res) {
                var game_states = JSON.parse(res.body);
                console.log(game_states);
                tokens = game_states[0].user_tokens;
                test.done();
            });
    },
    
    
    'play 3 more times': function(test){
        exports['game tests']['play 3 times'](test);
    },
    
    // Play the slots game and check the result
    'try to enter again': function(test) {
        var params = JSON.stringify({
            ll: '42.646261785714,-71.303897114286',
            message: "Don't let me enter",
            phone_type: phone.type,
            phone_id: phone.unique_id,
            mobile_version: '1.0',
            challenge_response: auth.mobile_algorithms['1.0'](assert.challenge)
        });
        assert.response(test, Bozuko.app,
            {url: game_entry_link+"/?token="+token,
            method: 'POST',
            headers: headers,
            data: params},
            {status: 500, headers: {'Content-Type': 'application/json; charset=utf-8'}},
            function(res) {
                var facebook_checkin_result = JSON.parse(res.body);
                console.log(facebook_checkin_result)
                test.done();
            });
    },
    
    // Play the slots game and check the result
    'double check game entry and wait' : function(test) {
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
                console.log( game_state );
                test.ok( game_state.button_enabled == false, 'Out of tokens, need to wait till next entry' );
                // test.ok( game_state.button_text == 'Play again later...', 'Out of tokens, need to wait till next entry' );
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
    },
    'do a literal facebook checkin' : function(test) {
        
        var params = JSON.stringify({
            ll: '42.646261785714,-71.303897114286',
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
                var game_states = JSON.parse(res.body);
                console.log(game_states);
                test.ok(Bozuko.validate(['game_state'], game_states));
                tokens = game_states[0].user_tokens;
                test.ok(tokens===3, 'did not get the right amount of tokens from checkin: '+tokens);
                link = game_states[0].links.game_result;
                exports['game tests']['play 3 times'](test);
            });
    }

};


exports['prizes tests'] = {
    'check number of wins matches amount of prizes' : function(test){
        assert.response(test, Bozuko.app,
            {url: prizes_link+'/?token='+token},
            ok,
            function(res) {
                var result = JSON.parse(res.body);
                test.ok( result.prizes.length === wins, 'Correct number of prizes' );
                prizes = result.prizes;
                test.done();
            });
    },
    
    'test query against prize name' : function(test){
        
        if( wins == 0 ){
            return test.done();
        }
        
        // lets check the prizes for a test query
        var prize = prizes[0];
        var query = prize.name;
        
        return assert.response(test, Bozuko.app,
            {url: prizes_link+'/?token='+token+'&query='+escape(query)},
            ok,
            function(res) {
                var result = JSON.parse(res.body);
                console.log(result);
                test.ok( result.prizes.length > 0, 'Found one' );
                test.done();
            });
    },
    
    'test query against page name' : function(test){
        
        if( wins == 0 ){
            return test.done();
        }
        
        // lets check the prizes for a test query
        var prize = prizes[0];
        var query = prize.page_name;
        
        return assert.response(test, Bozuko.app,
            {url: prizes_link+'/?token='+token+'&query='+escape(query)},
            ok,
            function(res) {
                var result = JSON.parse(res.body);
                test.ok( result.prizes.length > 0, 'Found one' );
                test.done();
            });
    },
    
    'check a specific prize' : function(test){
    
        if( wins == 0 ){
            return test.done();
        }
        
        // lets get the prize link
        var prize_link = prizes[0].links.prize;
        
        return assert.response(test, Bozuko.app,
            {url: prize_link+'/?token='+token},
            ok,
            function(res) {
                var result = JSON.parse(res.body);
                console.log(result);
                test.done();
            });
    } ,
    'redeem an active prize' : function(test){
    
        if( wins == 0 ){
            return test.done();
        }
        
        // lets get the prize link
        var redeem_link = prizes[0].links.redeem;
        
        var params = JSON.stringify({
            ll: '42.646261785714,-71.303897114286',
            phone_type: phone.type,
            phone_id: phone.unique_id,
            mobile_version: '1.0',
            challenge_response: auth.mobile_algorithms['1.0'](assert.challenge)
        });
        
        return assert.response(test, Bozuko.app,
            {
                url: redeem_link+'/?token='+token,
                method: 'POST',
                headers: headers,
                data: params
            },
            ok,
            function(res) {            
                var result = JSON.parse(res.body);
                Bozuko.validate('redemption_object', result);
                test.ok(!!result.security_image, 'Redemption has a security image');
                test.done();
            });
    },
    
    'check for the adjusted number of active prizes' : function(test){
    
        if( wins == 0 ){
            return test.done();
        }
        
        return assert.response(test, Bozuko.app,
            {url: prizes_link+'/?token='+token+'&state=active'},
            ok,
            function(res) {
                var result = JSON.parse(res.body);
                console.log(result);
                test.ok( result.prizes.length === wins-1, 'Correct number of prizes' );
                test.done();
            });
    },
    
    'check for the number of redeemed prizes' : function(test){
    
        if( wins == 0 ){
            return test.done();
        }
        
        return assert.response(test, Bozuko.app,
            {url: prizes_link+'/?token='+token+'&state=redeemed'},
            ok,
            function(res) {
                var result = JSON.parse(res.body);
                test.ok( result.prizes.length === 1, 'Correct number of prizes' );
                test.done();
            });
    },
    
    'error out on redeeming again' : function(test){
    
        if( wins == 0 ){
            return test.done();
        }
        
        // lets get the prize link
        var redeem_link = prizes[0].links.redeem;
        
        var params = JSON.stringify({
            ll: '42.646261785714,-71.303897114286',
            phone_type: phone.type,
            phone_id: phone.unique_id,
            mobile_version: '1.0',
            challenge_response: auth.mobile_algorithms['1.0'](assert.challenge)
        });
        
        return assert.response(test, Bozuko.app,
            {
                url: redeem_link+'/?token='+token,
                method: 'POST',
                headers: headers,
                data: params
            },
            bad,
            function(res) {            
                var result = JSON.parse(res.body);
                test.ok(result.name == 'prize/already_redeemed', 'Received "already redeemed" error');
                test.done();
            }); 
    }
};

exports['quick overview'] = function(test){
    console.log('\n');
    console.log('********************************************');
    if( wins == 0 ){
        console.log('wow, you are unlucky. not a single win. play (test) again for a chance to ');
        
    }
    else{
        console.log('good job buddy, you won!');
        prizes.forEach( function(prize, i){
            var result = win_results[i];
            console.log( '['+result.result+']\n\t'+prize.name);
        });
    }
    console.log('********************************************');
    console.log('\n');
    return test.done();
};
