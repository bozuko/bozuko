var assert = require('assert'),
    async = require('async'),
    testsuite = require('./config/testsuite'),
    inspect = require('util').inspect
;

var token = assert.token,
    challenge = assert.challenge,
    phone = assert.phone,
    headers = {'content-type': 'application/json'},
    ok = {status: 200, headers: {'Content-Type': 'application/json; charset=utf-8'}},
    bad = {status: 500, headers: {'Content-Type': 'application/json; charset=utf-8'}}
;

exports.setup = function(test) {
    testsuite.setup(test.done);
    auth = Bozuko.require('core/auth');
};

var link = '/api';
var pages_link, prizes_link, game_entry_link;

exports['get_root'] = function(test) {
    assert.response(test, Bozuko.app,
        {url: link+'/?token='+token},
        ok,
        function(res) {
            var entry_point = JSON.parse(res.body);
            test.ok(Bozuko.validate('entry_point', entry_point));
            pages_link = entry_point.links.pages;
            prizes_link = entry_point.links.prizes;
            test.done();
        }
    );
};

var page1, page2;
exports['center search - ensure pages share contest'] = function(test) {
    assert.response(test, Bozuko.app,
    {url: pages_link+'/?ll=42.646261785714,-71.303897114286&token='+token},
    ok,
    function(res) {
        var result = JSON.parse(res.body);
        console.log(result);
        result.pages.forEach(function(page) {

            if (page.id == assert.page1.id) {
                test.ok(!page1);
                test.equal(assert.multipage_contest_id, page.games[0].id);
                page1 = page;
                test.ok(page1.games[0].game_state.links.game_entry);
            } else if (page.id == assert.page2.id) {
                test.ok(!page2);
                test.equal(assert.multipage_contest_id, page.games[0].id);
                page2 = page;
                test.ok(page2.games[0].game_state.links.game_entry);
            }
        });
        test.notEqual(page1.games[0].game_state.links.game_entry, page2.games[0].game_state.links.game_entry);
        test.ok(page1);
        test.ok(page2);
        test.done();
    });
};

var check_fresh_game_state = function(gs, test) {
    test.equal(gs.button_action, 'enter');
    test.equal(gs.button_text, 'Check In to Play');
    test.equal(gs.button_enabled, true);
    test.equal(gs.game_over, false);
    test.equal(gs.user_tokens, 0);
    test.ok(gs.links.game_entry);
    test.ok(gs.links.game_state);
    test.ok(gs.links.game);
};

var page1_game_state, page2_game_state;
exports['get page1 game_state'] = function(test) {
    assert.response(test, Bozuko.app,
        {url: page1.games[0].game_state.links.game_state+'/?token='+token},
        ok,
        function(res) {
            page1_game_state = JSON.parse(res.body);
            check_fresh_game_state(page1_game_state, test);
            test.done();
        }
    );
};

exports['get page2 game_state'] = function(test) {
    assert.response(test, Bozuko.app,
        {url: page2.games[0].game_state.links.game_state+'/?token='+token},
        ok,
        function(res) {
            page2_game_state = JSON.parse(res.body);
            check_fresh_game_state(page1_game_state, test);
            test.done();
        }
    );
};

exports['get page1 game_state with no token (no user)'] = function(test) {
    assert.response(test, Bozuko.app,
        {url: page1.games[0].game_state.links.game_state},
        ok,
        function(res) {
            var game_state = JSON.parse(res.body);
            check_fresh_game_state(game_state, test);
            test.done();
        }
    );
};

exports['get page2 game_state with no token (no user)'] = function(test) {
    assert.response(test, Bozuko.app,
        {url: page2.games[0].game_state.links.game_state},
        ok,
        function(res) {
            var game_state = JSON.parse(res.body);
            check_fresh_game_state(game_state, test);
            test.done();
        }
    );
};

var tokens = 0;

function check_valid_game_state(gs, test) {
    test.equal(gs.button_text, 'Play');
    test.equal(gs.button_action, 'play');
    test.equal(gs.button_enabled, true);
    test.equal(gs.game_over, false);
    test.ok(gs.links.game_result);
    test.notEqual(-1, gs.links.game_result.indexOf('-'));
    test.ok(gs.links.game);
    test.notEqual(-1, gs.links.game.indexOf('-'));
    test.ok(gs.links.game_state);
    test.notEqual(-1, gs.links.game_state.indexOf('-'));
}

exports['enter contest at page1'] = function(test) {
    var url = page1_game_state.links.game_entry+"/?token="+token;
    var params = JSON.stringify({
        ll: '42.646261785714,-71.303897114286',
        message: "This place is off the hook!",
        phone_type: phone.type,
        phone_id: phone.unique_id,
        mobile_version: '1.0',
        challenge_response: auth.mobile_algorithms['1.0'](assert.challenge,{url:url})
    });

    assert.response(test, Bozuko.app,
        {url: url, method: 'POST', headers: headers, data: params},
        ok,
        function(res) {
            var gs = page1_game_state = JSON.parse(res.body)[0];
            test.ok(Bozuko.validate('game_state', gs));
            tokens = gs.user_tokens;
            test.equal(tokens, 3);
            check_valid_game_state(gs, test);
            test.done();
        }
    );
};

exports['enter contest at page2 - fail - too soon'] = function(test) {
    var url = page2_game_state.links.game_entry+"/?token="+token;
    var params = JSON.stringify({
        ll: '42.646261785714,-71.303897114286',
        message: "This place is off the hook!",
        phone_type: phone.type,
        phone_id: phone.unique_id,
        mobile_version: '1.0',
        challenge_response: auth.mobile_algorithms['1.0'](assert.challenge,{url:url})
    });

    assert.response(test, Bozuko.app,
        {url: url, method: 'POST', headers: headers, data: params},
        {status: 403, headers: {'Content-Type': 'application/json; charset=utf-8'}},
        function(res) {
            test.done();
        }
    );
};

exports['wait 10 seconds to enter again'] = function(test) {
    console.log("Waiting 30 seconds to enter contest at page2 - the location moved so we have to wait longer to avoid too far too soon error");
    setTimeout(test.done, 30000);
};

// In reality a client won't do this as the play button should be displayed. But this can be done
// by scripts/api browser/ and malicious clients.
exports['enter contest at page2 - success'] = function(test) {
    var url = page2_game_state.links.game_entry+"/?token="+token;
    var params = JSON.stringify({
        ll: '42.646261785714,-71.303897114286',
        message: "This place is off the hook!",
        phone_type: phone.type,
        phone_id: phone.unique_id,
        mobile_version: '1.0',
        challenge_response: auth.mobile_algorithms['1.0'](assert.challenge,{url:url})
    });

    assert.response(test, Bozuko.app,
        {url: url, method: 'POST', headers: headers, data: params},
        ok,
        function(res) {
            var gs = page2_game_state = JSON.parse(res.body)[0];
            test.ok(Bozuko.validate('game_state', gs));
            tokens = gs.user_tokens;
            test.equal(tokens, 6);
            check_valid_game_state(gs, test);
            test.done();
        }
    );
};

exports['play all tokens at page 2 - success'] = function(test) {
    var url = page2_game_state.links.game_result+"/?token="+token;
    var params = JSON.stringify({
        ll: '42.646261785714,-71.303897114286',
        message: "This place is off the hook!",
        phone_type: phone.type,
        phone_id: phone.unique_id,
        mobile_version: '1.0',
        challenge_response: auth.mobile_algorithms['1.0'](assert.challenge,{url:url})
    });

    var i = 0;
    return async.whilst(
        function() {
            return i < 6;
        },
        function(callback) {
            assert.response(test, Bozuko.app,
                {url: url, method: 'POST', headers: headers, data: params},
                ok,
                function(res) {
                    var result = JSON.parse(res.body);
                    test.ok(Bozuko.validate('game_result', result));
                    var gs = result.game_state;
                    test.equal(gs.user_tokens, 5 - i);
                    test.equal(gs.button_enabled, true);
                    if (gs.user_tokens > 0) {
                        test.equal(gs.button_text, 'Play');
                        test.equal(gs.button_action, 'play');
                        test.ok(gs.links.game_result);
                    } else {
                        test.equal(gs.button_text, 'Play again!');
                        test.equal(gs.button_action, 'enter');
                        test.ok(!gs.links.game_result);
                    }
                    i++;
                    callback();
                }
            );
        },
        function(err) {
            test.done();
        }
    );
};

exports['play and fail - no tokens'] = function(test) {
    var url = page2_game_state.links.game_result+"/?token="+token;
    var params = JSON.stringify({
        ll: '42.646261785714,-71.303897114286',
        message: "This place is off the hook!",
        phone_type: phone.type,
        phone_id: phone.unique_id,
        mobile_version: '1.0',
        challenge_response: auth.mobile_algorithms['1.0'](assert.challenge,{url:url})
    });

    // have to use an old link
    assert.response(test, Bozuko.app,
    {url: url, method: 'POST', headers: headers, data: params},
    bad,
    function(res) {
        test.done();
    });

};
