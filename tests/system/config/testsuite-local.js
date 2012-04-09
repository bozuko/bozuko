process.env.NODE_ENV='test';

var async = require('async');
var express = require('express');
var Bozuko = require('../../../app/bozuko');
var inspect = require('util').inspect;
var request = require('request');

/*
 * Simple wrapper around Mikeal's request that automatically fills in the server host:port.
 * You can use this instead of assert.response in your tests if you like.
 */
exports.request = function(options, callback) {
    if (typeof options === 'string') {
        options = {
            uri: options
        }
    }
    options.uri = 'http://'+Bozuko.config.server.host+':'+Bozuko.config.server.port+options.uri;
    request(options, callback);
};

exports.setup = function(callback) {
    if( !Bozuko.app ){
        Bozuko.getApp().listen(Bozuko.getConfig().server.port);
    }

    async.series([
        cleanup,
        add_page,
        add_contest,
        publish_contest
    ], callback);
};

var page = exports.page = new Bozuko.models.Page();
var contest = exports.contest = new Bozuko.models.Contest({
    engine_type: 'order',
    game: 'slots',
    game_config: {
        theme: 'default'
    },
    entry_config: [{
        type: "bozuko/nothing",
        tokens: 3,
        duration: 1000 
    }],
    win_frequency: 1,
    start: new Date(),
    end: new Date(Date.now()+1000),
    free_play_pct: 0
});

function emptyCollection(name) {
    return function(callback){
        Bozuko.models[name].remove(function(){callback(null, '');});
    };
}

function cleanup(callback) {
    var e = emptyCollection;
    async.parallel([e('User'), e('Entry'), e('Contest'), e('Page'), e('Checkin'), e('Play'), e('Prize'),
        e('Result')], callback);
}

function add_page(cb) {
    page.active = true;
    page.name = 'testPage';
    page.save(cb);
}

function add_contest(cb) {
    contest.prizes.push({
        name: 'DBC $10 giftcard',
        value: '0',
        description: 'Gonna create some sick desynes fer you',
        details: 'Don\'t worry, you won\'t make money off this',
        instructions: 'Check yer email fool!',
        total: 5,
        won: 0,
        redeemed: 0,
        is_email: true,
        email_body: 'Give the gift code to the proprietor and watch him amaze you!',
        email_codes: ["15h1ttyd3s1gn"]
    });
    contest.page_id = exports.page._id;
    contest.save(cb);
}

function publish_contest(cb) { 
    contest.publish(cb);
}
