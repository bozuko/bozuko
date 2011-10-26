process.env.NODE_ENV='test';
var bozuko = require('../../../../bozuko');
var TimeEngine = require('../time');
var inspect = require('util').inspect;
var Oid = require('mongoose').Types.ObjectId;
var async = require('async');
var rand = Bozuko.require('util/math').rand;
var Chart = require('cli-chart');

// Mock Contest
var contest = {
    _id:  new Oid(),
    prizes: [{
        _id: new Oid(),
        total: 5
    }],
    totalPrizes: function() { return this.prizes[0].total;}
};

// Mock user
var user = {
    _id: new Oid()
};

// Mock entry
var entry = {
    _id: new Oid()
};

var hr = 1000*60*60;
var day = hr*24;

exports['remove results'] = function(test) {
    Bozuko.models.Result.remove(function(err) {
        test.ok(!err);
        test.done();
    });
};

var results;
var result_cursor = 0;

exports['generate 5 results '] = function(test) {
    contest.start = new Date();
    contest.end = new Date(contest.start.getTime() + hr);
    
    var engine = new TimeEngine(contest);
    engine.generateResults(function(err, _results) {
        test.ok(!err);
        test.equal(_results.length, 5);
        results = _results;

        Bozuko.models.Result.count(function(err, count) {
            test.equal(count, 5);
            test.done();
        });
    });
};

exports['win'] = function(test) {
    results.sort(function(a, b) {
        return a.timestamp.getTime() - b.timestamp.getTime();
    });
    var engine = new TimeEngine(contest);
    var memo = {
        timestamp: new Date(results[result_cursor].timestamp.getTime()+1),
        user: user,
        entry: entry
    };
    engine.play(memo, function(err, memo) {
        test.ok(!err);
        test.ok(memo.result);
        test.equal(memo.result.timestamp.getTime(), results[result_cursor].timestamp.getTime());
        result_cursor++;
        test.done();
    });
};

exports['free spin and win'] = function(test) {
    contest.free_play_pct = 100;
    var engine = new TimeEngine(contest);
    var memo = {
        timestamp: new Date(results[result_cursor].timestamp.getTime()+1),
        user: user,
        entry: entry
    };
    engine.play(memo, function(err, memo) {
        test.ok(!err);
        test.equal(memo.result, 'free_play');
        delete memo.result;
        // reset the contest and engine instance to have no free plays
        contest.free_play_pct = 0;
        engine.free_play_odds = 0;
        engine.play(memo, function(err, memo) {
            test.ok(!err);
            test.equal(memo.result.timestamp.getTime(), results[result_cursor].timestamp.getTime());
            result_cursor++;
            test.done();            
        });
    });
};

exports['lose and redistribute'] = function(test) {
    var next_win_time = results[result_cursor].timestamp.getTime();
    var engine = new TimeEngine(contest);
    // Set engine.lookback_window to 1ms so we can force a redistribution
    engine.lookback_window = 1;
    var memo = {
        timestamp: new Date(next_win_time+2),
        user: user,
        entry: entry
    };
    engine.play(memo, function(err, memo) {
        test.ok(!err);
        test.ok(!memo.result);
        // Check that the result(timestamp) was redistributed;
        Bozuko.models.Result.findOne({timestamp: new Date(next_win_time)}, function(err, result) {
            test.ok(!err);
            test.ok(!result);
            Bozuko.models.Result.findOne(
                {'history.timestamp': new Date(next_win_time), 'history.move_time': memo.timestamp},
                function(err, result) {
                    console.log(err);
                    test.ok(!err);
                    test.ok(result);
                    result_cursor++;
                    test.done();
                }
            );
        });
    });
};

exports['lose, but don\'t redistribute - inside buffer'] = function(test) {
    var engine = new TimeEngine(contest);
    // Set engine.lookback_window to 1ms so we can force a redistribution
    engine.lookback_window = 1;
    var last_win_time = null;
    Bozuko.models.Result.findOne({timestamp: {$lt: engine.buffer_start}}, {timestamp: 1}, {sort: {timestamp: 1}}, function(err, result) {
        if (result) last_win_time = result.timestamp.getTime();

        // Set the timestamp to right before the buffer so we don't get a redistribution into the buffer
        var memo = {
            timestamp: new Date(engine.buffer_start.getTime()-1),
            user: user,
            entry: entry
        };
        engine.play(memo, function(err, memo) {
            test.ok(!err);
            test.ok(!memo.result);

            // Only check to see if the last play wasn't redistributed if there was a free one before
            // engine.buffer_start. There should almost always be a last_win_time.
            if (last_win_time) {
                return Bozuko.models.Result.findOne({timestamp: new Date(last_win_time)}, function(err, result) {
                    test.ok(!err);
                    test.ok(result);
                    test.done();
                });
            }
            test.done();
        });    
    });
};

exports['play at end of contest and win remaining 3 prizes'] = function(test) {
    var engine = new TimeEngine(contest);

    var win = function(cb) {
        var memo = {
            timestamp: new Date(contest.end.getTime()-1),
            user: user,
            entry: entry
        };
        engine.play(memo, function(err, memo) {
            console.log('win');
            test.ok(!err);
            test.ok(memo.result);
            cb(null);
        });
    };

    var lose = function(cb) {
        var memo = {
            timestamp: new Date(contest.end.getTime()-1),
            user: user,
            entry: entry
        };
        engine.play(memo, function(err, memo) {
            console.log('lose');
            test.ok(!err);
            test.ok(!memo.result);
            cb(null);
        });
    };

    async.series([win, win, win, lose, lose, lose], function(err) {
        test.done();
    });
};

exports['cleanup'] = function(test) {
    Bozuko.models.Result.remove(function(err) {
        test.ok(!err);
        test.done();
    });
};

exports['publish 1 month / 1 prize contest'] = function(test) {
    contest.start = new Date();
    contest.end = new Date(contest.start.getTime() + 30*day);
    contest.prizes[0].total = 1;
    var engine = new TimeEngine(contest);
    engine.generateResults(function(err, _results) {
        test.ok(!err);
        test.equal(_results.length, 1);
        results = _results;

        Bozuko.models.Result.count(function(err, count) {
            test.equal(count, 1);
            test.done();
        });
    });
};

var timestamps = [];
exports['play out contest randomly'] = function(test) {
    var engine = new TimeEngine(contest);
    for (var i = 0; i < 200; i++) {
        timestamps.push(new Date(rand(contest.start.getTime(),contest.end.getTime())));
    }
    timestamps.sort(function(a, b) {
        return a.getTime() - b.getTime();
    });

    var win_ct = 0;
    async.forEachSeries(timestamps, function(timestamp, cb) {
        var memo = {
            timestamp: timestamp,
            user: user,
            entry: entry
        };
        engine.play(memo, function(err, memo) {
            test.ok(!err);
            if (memo.result) win_ct++;
            cb(null);
        });
    }, function(err) {
        test.equal(win_ct, 1);
        test.done();
    });
};

exports['graph 1 month / 1 prize'] = function(test) {
    var playchart = new Chart({height: 20, width: 120, direction: 'y', xlabel: 'time (days)', 
        ylabel: 'plays', step: 3, xmax: 40, ymax: 20});
    var winchart = new Chart({height: 10, width: 120, direction: 'y', xlabel: 'time (days)',
        ylabel: 'wins', step: 3, xmax: 40, ymax: 1});
    
    var buckets = [],
        j = 0,
        start = contest.start.getTime(),
        win_timestamp = results[0].timestamp.getTime();

    for (var i = 0; i < 30; i++) {
        buckets[i] = 0;
        
        while (j < timestamps.length) {
            if (timestamps[j].getTime() >= start+day*i
                && timestamps[j].getTime() < start+day*(i+1)) {
                buckets[i]++;
                j++;
            } else {
                playchart.addBar(buckets[i]);
                break;
            }
        }

        if (win_timestamp >= start+day*i && win_timestamp < start+day*(i+1)) {
            winchart.addBar(1);
        } else {
            winchart.addBar(0);
        }
        
    }
    playchart.draw();
    winchart.draw();
    test.done();
};

