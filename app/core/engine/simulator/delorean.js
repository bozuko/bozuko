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
    .default('window_divisor', 2)
    .default('throwahead_multiplier', 0.5)
    .default('out', process.env.HOME+'/delorean_out.csv')
    .default('sparse_plays', 1)
    .default('sparse_prizes', 1)
    .default('sim_plays', 0)
    .argv;

if (!argv.contest) throw new Error("Need a contest to simulate");

var user = new Bozuko.models.User(
{
    name: 'Marty McFly',
    first_name: 'Marty',
    last_name: 'McFly',
    email: 'marty@mcfly.net',
    token: 'sillytimetravelingtoken',
    gender: 'male'
});

var ll = [42.646, -71.303];

// Mock entry model
var entry = {
    _id: new Oid()
};

run();

var path = process.env.HOME+'/bozuko/app/core/engine/simulator/input/'+argv.contest;

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

function mongoimport(callback) {
    var opts = {
        timeout: 60000,
        cwd: path
    };
    async.series([
        function import_page(cb) {
            exec('mongoimport --host pgdb1 --db bozuko_test9001 --collection pages --file ./page.json',
                opts, cb);
        },
        function import_contest(cb) {
            exec('mongoimport --host pgdb1 --db bozuko_test9001 --collection contests --file ./contest.json',
                opts, cb);
        }
    ], callback);
}

var wins = [];
var redistributions = [];
var timestamps = [];
var engine;
var contest;

function run() {
    async.series(
        [
            dropdb,
            mongoimport,
            function save_user(cb) {
                user.save(cb);
            },
            function get_contest(cb) {
                return fs.readFile(path+'/contest.json', function(err, json) {
                    if (err) return cb(err);
                    var data = JSON.parse(json);
                    var contest_id = new Oid(data._id['$oid']);
                    return Bozuko.models.Contest.findOne({_id: contest_id}, function(err, c) {
                        contest = c;
                        if (argv.sparse_prizes != 1) {
                            var total_prizes = contest.totalPrizes();
                            contest.totalPrizes = function() {
                                return total_prizes/argv.sparse_prizes;
                            };
                        }
                        cb(err);
                    });
                });
            },
            function clear_history_and_save_results(cb) {
                return fs.readFile(path+'/results.json', function(err, jsonlines) {
                    var jsonarray = jsonlines.split("\n");
                    var ct = -1;
                    return async.forEachSeries(jsonarray, function(json, cb) {
                        ct++;
                        if ((ct % argv.sparse_prizes) != 0) return cb();
                        var data = JSON.parse(json);
                        delete data._id;
                        delete data.win_time;
                        delete data.entry_id;
                        delete data.user_id;
                        data.contest_id = new Oid(data.contest_id['$oid']);
                        var timestamp = new Date(data.timestamp['$date']);
                        data.timestamp = timestamp;
                        data.history = [{timestamp: timestamp}];
                        var result = new Bozuko.models.Result(data);
                        result.save(cb);
                    }, function(err) {
                        return cb(err);
                    });
                });
            },
            function configure_engine(cb) {
                engine = new TimeEngine(contest);
                engine.configure({
                    buffer: argv.buffer,
                    window_divisor: argv.window_divisor,
                    throwahead_multiplier: argv.throwahead_multiplier
                });
                contest._engine = engine;
                cb();
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
    console.log("plays = "+timestamps.length);
    console.log("wins = "+wins.length);
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

    if (argv.sim_plays) {
        for (var i = 0; i < argv.sim_plays; i++) {
            timestamps.push(new Date(rand(contest.start.getTime(), contest.end.getTime())));
        }
        timestamps.sort(function(a, b) {
            return a.getTime() - b.getTime();
        });
        return async.forEachSeries(timestamps, function(timestamp, cb) {
            var memo = {
                timestamp: timestamp,
                user: user,
                entry: entry
            };
            return engine.play(memo, function(err, memo) {
                if (memo.result && memo.result != 'free_play') wins.push(memo.timestamp);
                return cb(err);
            });
        }, callback);
    }

    return fs.readFile(path+'/plays.json', function(err, jsonlines) {
        var jsonarray = jsonlines.split("\n");
        var ct = -1;
        return async.forEachSeries(jsonarray, function(json, cb) {
            ct++;
            if ((ct % argv.sparse_plays) != 0) return cb();
            var data = JSON.parse(json);
            var timestamp = new Date(data.timestamp.$date);
            timestamps.push(timestamp);
            var memo = {
                timestamp: timestamp,
                user: user,
                entry: entry
            };
            return engine.play(memo, function(err, memo) {
                if (memo.result && memo.result != 'free_play') wins.push(memo.timestamp);
                return process.nextTick(function() {cb(err);});
            });
        }, callback);
    });
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


