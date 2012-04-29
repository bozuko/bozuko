#!/usr/bin/env node

process.env.NODE_ENV = 'test';

var fs = require('fs'),
    bozuko = require('../../../bozuko'),
    async = require('async'),
    rand = Bozuko.require('util/math').rand,
    Chart = require('cli-chart'),
    Oid = require('mongoose').Types.ObjectId,
    TimeEngine = require('../time'),
    inspect = require('util').inspect,
    Profiler = Bozuko.require('util/profiler'),
    exec = require('child_process').exec
;

var argv = require('optimist')
    .default('buffer', 0.001)
    .default('window_divisor', 3)
    .default('throwahead_multiplier', 10)
    .default('out', process.env.HOME+'/delorean_out.csv')
    .default('plays', 1000)
    .default('lookback_threshold', 0.1)
    .default('multiplay', false)
    .argv;

if (!argv.contest) throw new Error("Need a contest to simulate");

// Mock entry model
var entry = {
    _id: new Oid()
};

var wins = [];
var redistributions = [];
var timestamps = [];
var engine;
var contest;

run();

function run() {
    async.series(
        [
            dropdb,
            saveUser,
            savePage,
            saveContest,
            configureEngine,
            generateResults,
            play,
            getRedistributions,
            outputDataFile
        ],
        function(err) {
            if (err) throw(err);
            chart();
        }
    );
}

function saveUser(cb) {
    user = require('./input/users/default')();
    user.save(cb);
}

function savePage(cb) {
    page = require('./input/pages/default')();
    page.save(cb);
}

function saveContest(cb) {
    contest = require('./input/contests/'+argv.contest)();
    contest.page_id = page._id;
    contest.save(cb);
}

function configureEngine(cb) {
    engine = new TimeEngine(contest);
    engine.configure({
        buffer: argv.buffer,
        window_divisor: argv.window_divisor,
        throwahead_multiplier: argv.throwahead_multiplier,
        lookback_threshold: argv.lookback_threshold,
        multiplay: false
    });
    contest._engine = engine;
    cb();
}

function generateResults(cb) {
    engine.generateResults(Bozuko.models.Page,  page._id, cb);
}

function getRedistributions(cb) {
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
}

function outputDataFile(cb) {
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


function buildKey(ts) {
 return ''+ts.getFullYear()+'-'+(ts.getMonth()+1)+'-'+ts.getDate()+'T'+ts.getHours();
}

var hr = 1000*60*60;

function empty_buckets() {
    var start_ms = contest.start.getTime();
    var end_ms = contest.end.getTime();
    var cur_ms = start_ms;
    var key;
    var buckets = {};
    while (cur_ms < end_ms) {
        key = buildKey(new Date(cur_ms));
        buckets[key] = {
            plays: 0,
            wins: 0,
            redist: 0
        };
        cur_ms += hr;
    }
    return buckets;
}

function createBuckets() {
    console.log("plays = "+timestamps.length);
    console.log("wins = "+wins.length);
    console.log("redistributions = "+redistributions.length);
    var buckets = empty_buckets();
    timestamps.forEach(function(ts) {
        var key = buildKey(ts);
        buckets[key].plays++;
    });
    wins.forEach(function(ts) {
        var key = buildKey(ts);
        buckets[key].wins++;
    });
    redistributions.forEach(function(ts) {
        var key = buildKey(ts);
        buckets[key].redist++;
    });
    return buckets;
}

function play(callback) {
    for (var i = 0; i < argv.plays; i++) {
        timestamps.push(new Date(rand(contest.start.getTime(), contest.end.getTime())));
    }
    timestamps.sort(function(a, b) {
        return a.getTime() - b.getTime();
    });
    async.forEachSeries(timestamps, function(timestamp, cb) {
        var memo = {
            timestamp: timestamp,
            user: user,
            entry: entry
        };
        engine.play(memo, function(err, memo) {
            if (memo.result && memo.result != 'free_play') wins.push(memo.timestamp);
            return cb(err);
        });
    }, callback);
}

function chart() {
    var playchart = new Chart({height: 20, width: 120, direction: 'y', xlabel: 'time (hours)',
        ylabel: 'plays', step: 1});
    var winchart = new Chart({height: 20, width: 120, direction: 'y', xlabel: 'time (hours)',
        ylabel: 'wins', step: 1});

    var redistchart = new Chart({height: 20, width: 120, direction: 'y', xlabel: 'time (hours)',
        ylabel: 'redistributions', step: 3});

    var start = contest.start.getTime();
    var end = contest.end.getTime();

    playchart.bucketize(timestamps, start, end);
    playchart.draw();
    winchart.bucketize(wins, start, end);
    winchart.draw();
    redistchart.bucketize(redistributions, start, end);
    redistchart.draw();
}

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

