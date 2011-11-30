#!/usr/bin/env node

var fs = require('fs'),
    bozuko = require('../../../bozuko'),
    async = require('async'),
    rand = Bozuko.require('util/math').rand,
    Chart = require('cli-chart'),
    Oid = require('mongoose').Types.ObjectId,
    TimeEngine = require('../time'),
    inspect = require('util').inspect,
    Profiler = Bozuko.require('util/profiler')
;

var argv = require('optimist')
    .default('buffer', 0.1)
    .default('window_divisor', 2)
    .default('throwahead_multiplier', 0.5)
    .default('out', process.env.HOME+'/delorean_out.csv')
    .argv;

var data = require(argv.f);

var user = new Bozuko.models.User(
{
    name: 'Marty McFly',
    first_name: 'Marty',
    last_name: 'McFly',
    email: 'bozukob@gmail.com',
    token: 'dfasaa33345353453543',
    gender: 'male'
});

var page = new Bozuko.models.Page({
    active: true,
    name: 'delorean'
});

var ll = [42.646, -71.303];


var contest = new Bozuko.models.Contest({
    engine_type: 'time',
    game: 'slots',
    game_config: {
        theme: 'default'
    },
    entry_config: [{
        type: "facebook/checkin",
        tokens: 5000,
        duration: 0
    }],
    start: data.start,
    end: data.end,
    free_play_pct: 0,
    prizes: [{
        name: 'stuff',
        value: 1,
        total: data.prizes
    }]
});

// Mock entry model
var entry = {
    _id: new Oid()
};

run();


function emptyCollection(name) {
    return function(callback){
        Bozuko.models[name].remove(function(){callback(null, '');});
    };
};

function dropdb(callback) {
    var e = emptyCollection;
    async.parallel([e('User'), e('Entry'), e('Contest'), e('Page'), e('Checkin'), e('Play'), e('Prize'),
        e('Result')], callback);
}

var wins = [];
var redistributions = [];
var timestamps = [];
var engine;

function run() {
    async.series(
        [
            dropdb,
            function save_page(cb) {
                page.save(cb);
            },
            function save_user(cb) {
                user.save(cb);
            },
            function save_contest(cb) {
                contest.page_id = page._id;
                contest.save(cb);
            },
            function remove_results(cb) {
                Bozuko.models.Result.remove(cb);
            },
            function generate_results(cb) {
                var prof = new Profiler('generate_results');
                engine = new TimeEngine(contest);
                engine.configure({
                    buffer: argv.buffer,
                    window_divisor: argv.window_divisor,
                    throwahead_multiplier: argv.throwahead_multiplier
                });
                engine.generateResults(Bozuko.models.Page, page._id, function(err) {
                    prof.mark('done');
                    cb(err);
                });
            },
            play,
            function get_redistributions(cb) {
                var prof = new Profiler('get_redistributions');
                Bozuko.models.Result.find({contest_id: contest._id}, {history: 1}, function(err, results) {
	            if (err) return cb(err);
	            for (var i = 0; i < results.length; i++) {
	                var result = results[i];
	                if (result.history.length > 1) {
                            for (var j = 1; j < result.history.length; j++) {
                                redistributions.push(result.history[j].move_time);
                            }
	                }
	            }
                    prof.mark('done');
                    return cb();
                });
            },
            function output_data_file(cb) {
                for (var i = 0; i < data.plays.length; i++) {
                    timestamps.push(data.plays[i].timestamp);
                }

                var buckets = createBuckets();

                var stream = fs.createWriteStream(argv.out);
                stream.write('Time,Hour,Plays,Wins,Redist\n');
                var keys = Object.keys(buckets);
                var ct = 0;
                keys.forEach(function(k) {
                    ct = ct + 1;
                    stream.write(k+','+ct+','+buckets[k].plays+','+buckets[k].wins+','+buckets[k].redist+'\n');
                });
                stream.end();
                stream.destroySoon();
                stream.on('close', cb);
            }
        ],
        function(err) {
            if (err) throw(err);
            chart();
        }
    );
}

function buildKey(ts) {
 return ''+ts.getFullYear()+'-'+(ts.getMonth()+1)+'-'+ts.getDate()+'T'+ts.getHours();
}

function createBuckets() {
    var buckets = {};
    timestamps.forEach(function(ts) {
        var key = buildKey(ts);
        if (!buckets[key]) {
            buckets[key] = {
                plays: 1,
                wins: 0,
                redist: 0
            };
        } else {
            buckets[key].plays++;
        }
    });
    wins.forEach(function(ts) {
        var key = buildKey(ts);
        if (!buckets[key]) {
            buckets[key] = {
                plays: 0,
                wins: 1,
                redist: 0
            };
        } else {
            buckets[key].wins++;
        }
    });
    redistributions.forEach(function(ts) {
        var key = buildKey(ts);
        if (!buckets[key]) {
            buckets[key] = {
                plays: 0,
                wins: 0,
                redist: 1
            };
        } else {
            buckets[key].redist++;
        }
    });
    return buckets;
}

function play(callback) {
    var prof = new Profiler('play');
    return async.forEachSeries(data.plays, function(play, cb) {
        var memo = {
            timestamp: new Date(play.timestamp),
            user: user,
            entry: entry
        };
        return engine.play(memo, function(err, memo) {
            if (memo.result) wins.push(play.timestamp);
            return process.nextTick(function() {cb(err);});
        });
    }, function(err) {
        prof.mark(''+data.plays.length+' plays');
        callback(err);
    });
}

function chart() {
    var playchart = new Chart({height: 20, width: 120, direction: 'y', xlabel: 'time (hours)',
        ylabel: 'plays', step: 3});
    var winchart = new Chart({height: 20, width: 120, direction: 'y', xlabel: 'time (hours)',
        ylabel: 'wins', step: 3});

    var redistchart = new Chart({height: 20, width: 120, direction: 'y', xlabel: 'time (hours)',
        ylabel: 'redistributions', step: 3});

    var start = data.start.getTime();
    var end = data.end.getTime();

    playchart.bucketize(timestamps, start, end);
    playchart.draw();
    winchart.bucketize(wins, start, end);
    winchart.draw();
    redistchart.bucketize(redistributions, start, end);
    redistchart.draw();
}


