var async = require('async');
var assert = require('assert');
var load = require('../../../load/load');
var express = require('express');
var db = require('./util/db');
var qs = require('querystring');

var inspect = require('util').inspect;

process.env.NODE_ENV='load';
var Bozuko = require('../../app/bozuko');

var auth = Bozuko.require('core/auth');

var user_ids_free = [];

var options = {
    protocol: 'https',
    host: '66.228.35.144',
    port: 8000,
    headers: { 'content-type': 'application/json'},
    encoding: 'utf-8',
    rate: 2, // req/sec
    time: 3600,
    wait_time: 10000, // ms
    path: '/api',
    method: 'GET',
    max_sessions: 1000,
    sessions: [{
	probability: 100,
	request_generators: [
            get_pages,
            checkin,
            play,
            play,
            play
        ]
    }]
};

function random_user_id() {
    var index = Math.floor(Math.random()*user_ids_free.length);
    var uid = user_ids_free[index];
    user_ids_free.splice(index, 1);
    return uid;
}

var db_setup_start = Date.now();
db.setup({users: options.max_sessions}, function(err) {
    var db_setup_end = Date.now();
    if (err) {
        console.log(new Error("db.setup: "+err));
        Bozuko.db.conn().disconnect();
        return;
    }

    user_ids_free = db.user_ids.slice();

    console.log("Db setup took "+(db_setup_end - db_setup_start)+" ms");
    console.log("Running Load Test");
    load.run(options, function(err, results) {
        if (err) return console.log("Err = "+err);
        console.log("results = "+require('util').inspect(results));

        // close the mongoose connection so the process exits
        Bozuko.db.conn().disconnect();
    });
});

function get_pages(res, callback) {
    var city = db.random_city();
    try {
        var pages_link = JSON.parse(res.body).links.pages;
    } catch(err) {
        return callback(err);
    }
    return callback(null, {
        path: pages_link+'/?ll='+city.lat+','+city.lng,
        method: 'GET',
        opaque: city
    });
}

function checkin(res, callback) {
    try {
        var pages = JSON.parse(res.body).pages;
    } catch(err) {
        return callback(err);
    }

    // Ignore timeouts from facebook
    if (res.statusCode != 200) {
        console.log("Checkin Error: "+res.body);
        return callback(null, 'done');
    }
    // grab a random page
    var page = pages[Math.floor(Math.random()*pages.length)];
    if (!Bozuko.validate('page', page)) {
        return callback(new Error("Failed to validate page"));
    }

    // we only want to pick pages that have games
    if (!page.registered) return callback(null, 'done');

    var city = res.opaque;

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
        var checkin_link = page.links.facebook_checkin;
        var params = JSON.stringify({
            ll: ''+city.lat+','+city.lng,
            message: "Load test checkin",
            phone_type: user.phones[0].type,
            phone_id: user.phones[0].unique_id,
            mobile_version: '1.0',
            challenge_response: auth.mobile_algorithms['1.0'](user.challenge)
        });

        return callback(null, {
            path: checkin_link+'/?token='+user.token,
            method: 'POST',
            body: params,
            opaque: {
                params: params,
                user_id: uid,
                auth_token: user.token,
                last_op: 'checkin'
            }
        });
    });
}

function play(res, callback) {
    try {
        var rv = JSON.parse(res.body);
    } catch(err) {
        console.log("Bombed out in play bitch");
        user_ids_free.push(res.opaque.user_id);
        return callback(err);
    }

    if (res.opaque.last_op === 'checkin') {
        if (!Bozuko.validate(['game_state'], rv)) {
            user_ids_free.push(res.opaque.user_id);
            return callback(new Error("Invalid game_state"));
        }
        if (rv === []) {
            user_ids_free.push(res.opaque.user_id);
            return callback(new Error("No game_states returned from entry"));
        }

        // This test only has one contest per page so just use the first game_state
        var state = rv[0];
        if (state.user_tokens != 3) {
            user_ids_free.push(res.opaque.user_id);
            return callback(new Error("game_state has invalid token count: ct = "+state.user_tokens));
        }
        res.opaque.message = "Load Test Play";
        res.opaque.user_tokens = 3;
        res.opaque.last_op = 'play';
        return callback(null, {
            path: state.links.game_result+'/?token='+res.opaque.auth_token,
            method: 'POST',
            body: res.opaque.params,
            opaque: res.opaque
        });
    } else {
        if (res.opaque.user_tokens === 0) {

            // allow reuse of this user
            user_ids_free.push(res.opaque.user_id);

            // This should be an error code (out of tokens)
            if (res.statusCode === 200) return callback(new Error("Play allowed with no tokens!"));

            // End the session
            return callback(null, 'done');
        }

        var token_ct = res.opaque.user_tokens - 1;
        if (rv.game_state.user_tokens != token_ct) {
            user_ids_free.push(res.opaque.user_id);
            return callback(new Error(
                "User token count incorrect: Expected: "+token_ct+", got: "+rv.user_tokens));
        }

        res.opaque.user_tokens = token_ct;

        // We are about to use our last token so free up the user
        if (token_ct === 1) {
            user_ids_free.push(res.opaque.user_id);
        }

        return callback(null, {
            path: rv.game_state.links.game_result+'/?token='+res.opaque.auth_token,
            method: 'POST',
            body: res.opaque.params,
            opaque: res.opaque
        });
    }
}

