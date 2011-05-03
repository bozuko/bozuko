/*
 * This test avoids hitting facebook
 */

var async = require('async');
var assert = require('assert');
var load = require('../../../node-load/load');
var express = require('express');
var db = require('util/db');
var qs = require('querystring');

// should probably add some sort of load test config
process.env.NODE_ENV='production';
var Bozuko = require('../../app/bozuko');

var auth = Bozuko.require('core/auth');

var options = {
    protocol: 'https',
    host: '66.228.35.144',
    port: 443,
    headers: { 'content-type': 'application/json'},
    encoding: 'utf-8',
    rate: 10, // req/sec
    time: 10, // sec
    sessions: [{
	probability: 100,
	requests: [{
	    path: '/api',
	    method: 'GET',
	    next: function(res, opaque, callback) {
                var city = db.random_city();
                var pages_link = JSON.parse(res.body).links.pages;
                return callback(null, {
                    path: pages_link+'/?ll='+city.lat+','+city.lng,
                    method: 'GET'
                }, city);
            }
        },
        {
            next: function(res, city, callback) {
                var pages = JSON.parse(res.body).pages;
                // grab a random page
                var page = pages[Math.floor(Math.random()*pages.length)];
                if (!Bozuko.validate('page', page)) {
                    return callback(new Error("Failed to validate page"));
                }

                // get a random user for checkin
                var uid = db.user_ids[Math.floor(Math.random()*db.user_ids.length)];
                Bozuko.models.User.findById(uid, function(err, user) {
                    if (err) return callback(err);
                    if (!user) return callback(new Error("Couldn't find user "+uid));
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
                        body: params
                    });
                });
            }
        },
        {
            next: function(res, opaque, callback) {
                console.log("res.body = "+res.body);
                return callback(null, 'done');
            }
        }]
    }]
};

var db_setup_start = Date.now();
db.setup({users: 100}, function(err) {
    var db_setup_end = Date.now();
    console.log("Db setup took "+(db_setup_end - db_setup_start)+" ms");
    if (err) console.log(new Error("db.setup: "+err));
    console.log("Running Load Test");
    load.run(options, function(err, results) {
        if (err) return console.log("Err = "+err);
        console.log("results = "+require('util').inspect(results));
    });
});

