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

var options = {
    protocol: 'https',
    host: '66.228.35.144',
    port: 443,
    headers: { 'content-type': 'application/json'},
    encoding: 'utf-8',
    rate: 20, // req/sec
    time: 1800, // sec
    wait_time: 10000, // ms
    path: '/api',
    method: 'GET',
    max_sessions: 1000,
    sessions: [{
	probability: 100,
	request_generators: [
            get_pages
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

    user_ids_free = db.user_ids.slice();

    console.log("Db setup took "+(db_setup_end - db_setup_start)+" ms");
    if (err) console.log(new Error("db.setup: "+err));
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

