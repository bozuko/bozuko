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
    rate: 50, // req/sec
    time: 1800, // sec
    wait_time: 10000, // ms
    path: '/api',
    method: 'GET',
    max_sessions: 1000,
    sessions: [{
	probability: 100,
	requests: [
        ]
    }]
};

load.run(options, function(err, results) {
    if (err) return console.log("Err = "+err);
    console.log("results = "+require('util').inspect(results));

    // close the mongoose connection so the process exits
    Bozuko.db.conn().disconnect();
});
