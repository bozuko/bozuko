/*
 * Complete all contests that exist in the db. They should have previously been created
 * with scripts/provision.
 */
var async = require('async');
var assert = require('assert');
var load = require('load');
var express = require('express');
var db = require('./util/db');
var qs = require('querystring');

var inspect = require('util').inspect;

process.env.NODE_ENV='load';
var Bozuko = require('../../app/bozuko');

var auth = Bozuko.require('core/auth');

var user_ids_free = [];
var end_of_game_errors = ['entry/no_tokens', 'entry/not_enough_tokens', 'contest/no_tokens',
    'contest/inactive','contest/no_plays', 'contest/invalid_entry'];
var end_of_game_ct = 0;

var options = {
    protocol: 'https',
    host: '66.228.35.144',
    port: 8000,
    headers: { 'content-type': 'application/json'},
    encoding: 'utf-8',
    rate: 20, // req/sec
    time: 24*60*60, // 1 day
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

Bozuko.models.User.find({}, {_id: 1}, function(err, docs) {
    docs.forEach(function(doc) {
        user_ids_free.push(doc._id);
    });
    console.log("Running Load Test");
    load.run(options, function(err, results) {
        if (err) {
            // close the mongoose connection so the process exits
            Bozuko.db.conn().disconnect();
            return console.error("Err = "+err);
        }
        console.log("\nresults = "+require('util').inspect(results));
        console.log("\ncomplete games = "+end_of_game_ct);

        // close the mongoose connection so the process exits
        Bozuko.db.conn().disconnect();
    });

});

function random_user_id() {
    var index = Math.floor(Math.random()*user_ids_free.length);
    var uid = user_ids_free[index];
    user_ids_free.splice(index, 1);
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
    Bozuko.models.User.findById(uid, function(err, user) {
        if (err) {
            user_ids_free.push(uid);
            return callback(err);
        }
        if (!user) {
            user_ids_free.push(uid);
            return callback(new Error("Couldn't find user "+uid));
        }

        var req = {
            url: '/facebook/'+city.id+'/checkin/?token='+user.token
        };

        var params = {
            ll: ''+city.lat+','+city.lng,
            message: "Load test checkin",
            phone_type: user.phones[0].type,
            phone_id: user.phones[0].unique_id,
            mobile_version: '1.0',
            challenge_response: auth.mobile_algorithms['1.0'](user.challenge, req)
        };

        return callback(null, {
            path: req.url,
            method: 'POST',
            body: JSON.stringify(params),
            opaque: {
                params: params,
                user: user,
                last_op: 'checkin'
            }
        });
    });
}

function play(res, callback) {
    try {
        var rv = JSON.parse(res.body);
    } catch(err) {
        console.error("Bombed out in play bitch");
        user_ids_free.push(res.opaque.user._id);
        return callback(err);
    }

    if (res.statusCode != 200)  {
        user_ids_free.push(res.opaque.user._id);
        if (end_of_game_errors.indexOf(rv.body.name) != -1) {
            end_of_game_ct++;
            return callback(null, 'done');
        }
        return callback(new Error(rv));
    }

    if (res.opaque.last_op === 'checkin') {
        if (!Bozuko.validate(['game_state'], rv)) {
            user_ids_free.push(res.opaque.user._id);
            return callback(new Error("Invalid game_state"));
        }
        if (rv === []) {
            user_ids_free.push(res.opaque.user._id);
            return callback(new Error("No game_states returned from entry"));
        }

        // Exhaust the first game first
        var state = rv[0];
        res.opaque.message = "Load Test Play";
        res.opaque.user_tokens = state.user_tokens;
        res.opaque.last_op = 'play';

        var req = {
            url: state.links.game_result+'/?token='+res.opaque.user.token
        };
        res.opaque.params.challenge_response = auth.mobile_algorithms['1.0'](res.opaque.user.challenge, req);

        return callback(null, {
            path: req.url,
            method: 'POST',
            body: JSON.stringify(res.opaque.params),
            opaque: res.opaque
        });
    } else {
        if (rv.game_state.user_tokens === 0) {
            user_ids_free.push(res.opaque.user._id);
            return callback(null, 'done');
        }

        if (res.opaque.user_tokens === rv.game_state.user_tokens) {
            // free play - add a request generator for it
            options.sessions[0].request_generators.push(play);
        } else {
            res.opaque.user_tokens = rv.game_state.user_tokens;
        }

        var req = {
            url: rv.game_state.links.game_result+'/?token='+res.opaque.user.token
        };
        res.opaque.params.challenge_response = auth.mobile_algorithms['1.0'](res.opaque.user.challenge, req);

        return callback(null, {
            path: req.url,
            method: 'POST',
            body: JSON.stringify(res.opaque.params),
            opaque: res.opaque
        });
    }
}
