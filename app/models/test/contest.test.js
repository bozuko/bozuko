var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    EntryConfig = require('../embedded/contest/entry/config'),
    Prize = require('../embedded/contest/prize'),
    ObjectId = Schema.ObjectId,
    async = require('async'),
    express = require('express'),
    bozuko = require('../../../bozuko');

// Initialize Bozuko
process.env.NODE_ENV='test';
bozuko.app = express.createServer();
bozuko.init();

var start = new Date();
var end = new Date();
end.setTime(start.getTime()+1000*60*60*24*2);

var data = {
    game: 'slots',
    game_config: {
        icons: ['seven','bar','bozuko','banana','monkey','cherries']
    },
    entry_config: {
        type: "facebook/checkin",
        tokens: 3
    },
    start: start,
    end: end,
    total_entries: 1000,
    total_plays: 3000,
    play_cursor: -1,
    token_cursor: -1
};

var contest = new Bozuko.models.Contest(data);

exports['enter and play'] = function(test) {
    test.done();
};

exports['enter and play - expired'] = function(test) {
    test.done();
};
