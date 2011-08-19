/*
 *  Complete One contest. It should have previously been created with scripts/provision.
 */

var async = require('async');
var load = require('load');

var inspect = require('util').inspect;

process.env.NODE_ENV='load';
var Bozuko = require('../../app/bozuko');

var auth = Bozuko.require('core/auth');

var end_of_game_errors = ['entry/no_tokens', 'entry/not_enough_tokens', 'contest/no_tokens',
    'contest/inactive','contest/no_plays', 'contest/invalid_entry'];
var end_of_game_ct = 0;

var options = {
    protocol: 'https',
    host: Bozuko.config.server.host,
    port: Bozuko.config.server.port,
    headers: { 'content-type': 'application/json'},
    encoding: 'utf-8',
    rate: 2, // req/sec
    time: 60, // sec
    wait_time: 10000, // ms -- after the last request, time to wait for others to complete
    timeout: 20000, //ms  -- socket timeout
    path: '/api',
    method: 'GET',
    max_sessions: 50,
    sessions: [{
        probability: 100,
        request_generators: [
            enter,
            play,
            play,
            play,
            play
        ]
    }]
};
var users = [];
var games = [];

function loadUsers(cb) {
    Bozuko.models.User.count({}, function(err, count) {
        for (var i = 0; i < count; i++) {
            users.push(String(i));
        }
        cb(err);
    });    
}

function loadGames(cb) {
    Bozuko.models.Contest.find({}, {_id: 1}, {}, function(err, contests) {
        games = contests;
        cb(err);
    });
}

(function run() {
    async.parallel(
        [loadUsers, loadGames], 
        function(err) {
           if (err) throw(err);
           load.run(options, function(err, results) {
               if (err) return console.error("Err = "+err);
               console.log("\nresults = "+require('util').inspect(results));
               console.log("\ncomplete games = "+end_of_game_ct);
           });
        }
    );
})();

function randomUser() {
    var i = Math.floor(Math.random()*users.length);
    return users[i];
}

function randomGameId() {
    var i = Math.floor(Math.random()*games.length);
    return games[i]._id;
}

function enter(res, callback) {

    var city = {
        lat: 42.396404637936,
        lng: -71.121946652025,
        id: "117689721590676"
    };

    // get a random user for checkin
    var uid = randomUser();
    var game_id = randomGameId();

    var req = {
        url: '/game/'+game_id+'/entry/?token='+uid
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
        return callback(err);
    }

    if (res.statusCode != 200)  {
        if (rv.body && end_of_game_errors.indexOf(rv.body.name) != -1) {
            end_of_game_ct++;
            return callback(null, 'done');
        }
        return callback(new Error(rv));
    }

    if (res.opaque.last_op === 'checkin') {
        if (!Bozuko.validate(['game_state'], rv)) {
            return callback(new Error("Invalid game_state"));
        }
        if (rv.length === 0) {
            return callback(null, 'done');
        }

        // Exhaust the first game first
        console.log(inspect(rv));
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