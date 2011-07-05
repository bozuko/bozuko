/*
 * Complete One contest. It should have previously been created with scripts/provision.
 */
var async = require('async');
var load = require('load');

var inspect = require('util').inspect;

process.env.NODE_ENV='playground';
var Bozuko = require('../../app/bozuko');

var auth = Bozuko.require('core/auth');

var free_users = [];

var end_of_game_errors = ['entry/no_tokens', 'entry/not_enough_tokens', 'contest/no_tokens',
    'contest/inactive','contest/no_plays', 'contest/invalid_entry'];
var end_of_game_ct = 0;

var options = {
    protocol: 'https',
    host: 'playground.bozuko.com',
    port: 443,
    headers: { 'content-type': 'application/json'},
    encoding: 'utf-8',
    rate: 50, // req/sec
    time: 60*60, // 1 day
    wait_time: 10000, // ms
    path: '/api',
    method: 'GET',
    max_sessions: 50,
    sessions: [{
	probability: 100,
	request_generators: [
            checkin,
            play,
            play,
            play,
            play
        ]
    }]
};

(function run() {
     for (var i = 0; i < 100000; i++) {
         free_users.push(String(i));
     }

    console.log("Running Load Test");
    load.run(options, function(err, results) {
        if (err) return console.error("Err = "+err);

        console.log("\nresults = "+require('util').inspect(results));
        console.log("\ncomplete games = "+end_of_game_ct);
    });
})();

function random_user_id() {
    var index = Math.floor(Math.random()*free_users.length);
    var uid = free_users[index];
    free_users.splice(index, 1);
    return uid;
}

function checkin(res, callback) {

    var city = {
        lat: 42.396404637936,
        lng: -71.121946652025,
        id: "117689721590676"
    };

    // get a random user for checkin
    var uid = random_user_id();

    var req = {
        url: '/facebook/'+city.id+'/checkin/?token='+uid
    };

    var params = {
        ll: ''+city.lat+','+city.lng,
        message: "Load test checkin",
        phone_type: 'iphone',
        phone_id: uid,
        mobile_version: '1.0',
        challenge_response: auth.mobile_algorithms['1.0'](uid, req)
    };

    return callback(null, {
        path: req.url,
        method: 'POST',
        body: JSON.stringify(params),
        opaque: {
            params: params,
            uid: uid,
            last_op: 'checkin'
        }
    });
}

function play(res, callback) {
    try {
        var rv = JSON.parse(res.body);
    } catch(err) {
        console.error("Bombed out in play bitch");
        free_users.push(res.opaque.uid);
        return callback(err);
    }

    if (res.statusCode != 200)  {
        free_users.push(res.opaque.uid);
        if (rv.body && end_of_game_errors.indexOf(rv.body.name) != -1) {
            end_of_game_ct++;
            return callback(null, 'done');
        }
        return callback(new Error(rv));
    }

    if (res.opaque.last_op === 'checkin') {
        if (!Bozuko.validate(['game_state'], rv)) {
            free_users.push(res.opaque.uid);
            return callback(new Error("Invalid game_state"));
        }
        if (rv.length === 0) {
            free_users.push(res.opaque.uid);
            return callback(null, 'done');
        }

        // Exhaust the first game first
        var state = rv[0];
        res.opaque.message = "Load Test Play";
        res.opaque.user_tokens = state.user_tokens;
        res.opaque.last_op = 'play';

        var req = {
            url: state.links.game_result+'/?token='+res.opaque.uid
        };
        res.opaque.params.challenge_response = auth.mobile_algorithms['1.0'](res.opaque.uid, req);

        return callback(null, {
            path: req.url,
            method: 'POST',
            body: JSON.stringify(res.opaque.params),
            opaque: res.opaque
        });
    } else {
        if (rv.game_state.user_tokens === 0) {
            free_users.push(res.opaque.uid);
            return callback(null, 'done');
        }

        if (res.opaque.user_tokens === rv.game_state.user_tokens) {
            // free play - add a request generator for it
            options.sessions[0].request_generators.push(play);
        } else {
            res.opaque.user_tokens = rv.game_state.user_tokens;
        }

        var req = {
            url: rv.game_state.links.game_result+'/?token='+res.opaque.uid
        };
        res.opaque.params.challenge_response = auth.mobile_algorithms['1.0'](res.opaque.uid, req);

        return callback(null, {
            path: req.url,
            method: 'POST',
            body: JSON.stringify(res.opaque.params),
            opaque: res.opaque
        });
    }
}
