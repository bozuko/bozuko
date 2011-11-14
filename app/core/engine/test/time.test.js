process.env.NODE_ENV='test';
var bozuko = require('../../../bozuko');
var TimeEngine = require('../time');
var inspect = require('util').inspect;
var Oid = require('mongoose').Types.ObjectId;
var async = require('async');
var rand = Bozuko.require('util/math').rand;
var Chart = require('cli-chart');

var start = new Date().getTime();
var end = new Date();
end.setTime(start+(10000));

var day = 1000*60*60*24;
var hr = 1000*60*60;

var user = new Bozuko.models.User(
{
    name: 'Charlie Sheen',
    first_name: 'Charlie',
    last_name: 'Sheen',
    email: 'bozukob@gmail.com',
    token: 'dfasaa33345353453543',
    gender: 'male'
});

var page = new Bozuko.models.Page();
page.active = true;
page.name = "Test page";

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
    start: start,
    end: end,
    free_play_pct: 0,
    prizes: [{
        name: 'stuff',
        value: 1,
        total: 5
    }]
});

// Mock entry model
var entry = {
    _id: new Oid()
};

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

exports['save page'] = function(test) {
    dropdb(function() {
        page.save(function(err) {
            test.ok(!err);
            test.done();
        });
    });
};

exports['save user'] = function(test) {
    user.save(function(err) {
        test.ok(!err);
        test.done();
    });
};

exports['save contest'] = function(test) {
    contest.page_id = page._id;
    contest.save(function(err) {
        test.ok(!err);
        test.done();
    });
};

exports['remove results'] = function(test) {
    Bozuko.models.Result.remove(function(err) {
        test.ok(!err);
        test.done();
    });
};

var result_cursor = 0;

exports['generate 5 results '] = function(test) {
    contest.start = new Date();
    contest.end = new Date(contest.start.getTime() + hr);

    var engine = new TimeEngine(contest);
    engine.generateResults(function(err) {
        test.ok(!err);

        Bozuko.models.Result.count(function(err, count) {
            test.equal(count, 5);
            test.done();
        });
    });
};

var results = [];
exports['get results'] = function(test) {
    Bozuko.models.Result.find({}, function(err, _results) {
        test.ok(!err);
        results = _results;
        test.equal(results.length, 5);
        test.done();
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
            return test.done();
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
    results = [];
    engine.generateResults(function(err) {
        test.ok(!err);

        Bozuko.models.Result.count(function(err, count) {
            test.equal(count, 1);
            test.done();
        });
    });
};


function num_redistributions(callback) {
    var ct = 0;
    Bozuko.models.Result.find({contest_id: contest._id}, {history: 1}, function(err, results) {
	if (err) return callback(err);
	for (var i = 0; i < results.length; i++) {
	    var result = results[i];
	    if (result.history.length > 1) {
		ct += (result.history.length-1);
	    }
	}
	console.log("Total redistributions = "+ct);
	return callback(null, ct);
    });
};

var timestamps = [];
var win_timestamp;
exports['play out contest randomly'] = function(test) {
    var engine = new TimeEngine(contest);
    for (var i = 0; i < 200; i++) {
        timestamps.push(rand(contest.start.getTime(),contest.end.getTime()));
    }
    timestamps.sort(function(a, b) {
        return a - b;
    });

    var win_ct = 0;
    async.forEachSeries(timestamps, function(timestamp, cb) {
        var memo = {
            timestamp: new Date(timestamp),
            user: user,
            entry: entry
        };
        engine.play(memo, function(err, memo) {
            test.ok(!err);
            if (memo.result) {
                win_ct++;
                win_timestamp = timestamp;
                console.log("won at "+new Date(timestamp));
            }
            cb(null);
        });
    }, function(err) {
	return num_redistributions(function(err, ct) {
	    console.log("lookback window = "+engine.lookback_window/1000+" sec");
	    test.equal(win_ct, 1);
	    test.done();
	});
    });
};

exports['graph 1 month / 1 prize'] = function(test) {
    var playchart = new Chart({height: 20, width: 120, direction: 'y', xlabel: 'time (days)',
        ylabel: 'plays', step: 3, xmax: 30});
    var winchart = new Chart({height: 10, width: 120, direction: 'y', xlabel: 'time (days)',
        ylabel: 'wins', step: 3, xmax: 30});

    playchart.bucketize(timestamps);
    winchart.bucketize([win_timestamp], contest.start.getTime(), contest.end.getTime());
    playchart.draw();
    winchart.draw();
    test.done();
};

exports['cleanup 2'] = function(test) {
    Bozuko.models.Result.remove(function(err) {
        test.ok(!err);
        test.done();
    });
};

exports['publish 3 hrs / 1000 prize contest'] = function(test) {
    contest.start = new Date();
    contest.end = new Date(contest.start.getTime() + 3*hr);
    contest.prizes[0].total = 1000;
    var engine = new TimeEngine(contest);
    engine.generateResults(function(err, _results) {
        test.ok(!err);

        Bozuko.models.Result.count(function(err, count) {
            test.equal(count, 1000);
            test.done();
        });
    });
};

// buckets are 5 minutes wide
var play_buckets = [];
var win_buckets = [];

exports['play out 3hr contest randomly'] = function(test) {
    var engine = new TimeEngine(contest);
    var start = contest.start.getTime();
    var end = contest.end.getTime();
    var date = start;
    var max_step = (end - start) / 1000;
    var fivemin = 1000*60*5;
    var plays = 0;
    var wins = 0;
    var total_plays = 0,
        total_wins = 0;

    async.whilst(function() {
        return ((total_plays < 5000) && (total_wins < 1000));
    }, function(cb) {
        date += rand(0, max_step);
        if (date > (start + fivemin*(play_buckets.length+1))) {
            play_buckets.push(plays);
            win_buckets.push(wins);
            total_plays += plays;
            total_wins += wins;
            plays = 0;
            wins = 0;
        }
        var memo = {
            timestamp: new Date(date),
            user: user,
            entry: entry
        };
        engine.play(memo, function(err, memo) {
            test.ok(!err);
            plays++;
            if (memo.result) {
                wins++;
            }
            cb(null);
        });
    }, function(err) {
        test.ok(total_plays >= 1000);
        console.log("contest played out in "+(date-start)/(1000*60)+' minutes');
        console.log("total plays = "+total_plays);
	console.log("total wins = "+total_wins);
        test.equal(total_wins, 1000);
	return num_redistributions(function(err, ct) {
	    console.log("lookback window = "+engine.lookback_window/1000+" sec");
	    test.done();
	});
    });
};

exports['graph 3 hr / 1000 prize'] = function(test) {
    var playchart = new Chart({height: 20, width: play_buckets.length*3, direction: 'y', xlabel: 'time hrs',
        ylabel: 'plays', step: 3, xmax: play_buckets.length*5/60, ymax: 100});
    var winchart = new Chart({height: 20, width: win_buckets.length*3, direction: 'y', xlabel: 'time hrs',
        ylabel: 'wins', step: 3, xmax: win_buckets.length*5/60, ymax: 100});

    for (var i = 0; i < win_buckets.length; i++) {
        winchart.addBar({size: win_buckets[i]});
        playchart.addBar({size: play_buckets[i]});
    }

    playchart.draw();
    winchart.draw();
    test.done();
};

exports['cleanup 3'] = function(test) {
    Bozuko.models.Result.remove(function(err) {
        test.ok(!err);
        test.done();
    });
};

exports['publish 4 hrs / 50 prize contest'] = function(test) {
    contest.start = new Date();
    contest.end = new Date(contest.start.getTime() + 4*hr);
    contest.prizes[0].total = 50;
    var engine = new TimeEngine(contest);
    engine.generateResults(function(err, _results) {
        test.ok(!err);

        Bozuko.models.Result.count(function(err, count) {
            test.equal(count, 50);
            test.done();
        });
    });
};

var wins = [];
exports['play out contest - most play in first 2 hours - 25/25/15/1'] = function(test) {
    timestamps = [];
    var engine = new TimeEngine(contest);
    var start = contest.start.getTime();
    var i = 0;
    for (i = 0; i < 25; i++) {
        timestamps.push(rand(start, start+hr));
    }
    for (i = 0; i < 25; i++) {
	timestamps.push(rand(start+hr, start+hr*2));
    }
    for (i = 0; i < 15; i++) {
	timestamps.push(rand(start+hr*2, start+hr*3));
    }
    timestamps.push(rand(start+hr*3, start+hr*4));
    timestamps.sort(function(a, b) {
        return a - b;
    });

    async.forEachSeries(timestamps, function(timestamp, cb) {
        var memo = {
            timestamp: new Date(timestamp),
            user: user,
            entry: entry
        };
        engine.play(memo, function(err, memo) {
            test.ok(!err);
            if (memo.result) {
		wins.push(timestamp);
            }
            cb(null);
        });
    }, function(err) {
	return num_redistributions(function(err, ct) {
	    console.log("total wins = "+wins.length);
	    console.log("lookback window = "+engine.lookback_window/1000+" sec");
	    test.done();
	});
    });
};

exports['graph 4hr contest - most plays in first 2 hours - 25/25/15/1'] = function(test) {
    var playchart = new Chart({height: 20, width: 120, direction: 'y', xlabel: 'time (hours)',
        ylabel: 'plays', step: 3, xmax: 4});
    var winchart = new Chart({height: 20, width: 120, direction: 'y', xlabel: 'time (hours)',
        ylabel: 'wins', step: 3, xmax: 4});

    playchart.bucketize(timestamps, contest.start.getTime(), contest.end.getTime());
    winchart.bucketize(wins, contest.start.getTime(), contest.end.getTime());
    playchart.draw();
    winchart.draw();
    test.done();
};


exports['cleanup 4'] = function(test) {
    Bozuko.models.Result.remove(function(err) {
        test.ok(!err);
        test.done();
    });
};

exports['publish 4 hrs / 50 prize contest - again'] = function(test) {
    contest.start = new Date();
    contest.end = new Date(contest.start.getTime() + 4*hr);
    contest.prizes[0].total = 50;
    var engine = new TimeEngine(contest);
    engine.generateResults(function(err) {
        test.ok(!err);

        Bozuko.models.Result.count(function(err, count) {
            test.equal(count, 50);
            test.done();
        });
    });
};

exports['play out contest - most play in first 2 hours - 12/12/6/0'] = function(test) {
    wins = [];
    timestamps = [];
    var engine = new TimeEngine(contest);
    var start = contest.start.getTime();
    var i = 0;
    for (i = 0; i < 12; i++) {
        timestamps.push(rand(start, start+hr));
    }
    for (i = 0; i < 12; i++) {
	timestamps.push(rand(start+hr, start+hr*2));
    }
    for (i = 0; i < 6; i++) {
	timestamps.push(rand(start+hr*2, start+hr*3));
    }
    timestamps.sort(function(a, b) {
        return a - b;
    });

    async.forEachSeries(timestamps, function(timestamp, cb) {
        var memo = {
            timestamp: new Date(timestamp),
            user: user,
            entry: entry
        };
        engine.play(memo, function(err, memo) {
            test.ok(!err);
            if (memo.result) {
		wins.push(timestamp);
            }
            cb(null);
        });
    }, function(err) {
	return num_redistributions(function(err, ct) {
	    console.log("total wins = "+wins.length);
	    console.log("lookback window = "+engine.lookback_window/1000+" sec");
	    test.done();
	});
    });
};

exports['graph 4hr contest - most plays in first 2 hours - 12/12/6/0'] = function(test) {
    var playchart = new Chart({height: 20, width: 120, direction: 'y', xlabel: 'time (hours)',
        ylabel: 'plays', step: 3, xmax: 4});
    var winchart = new Chart({height: 20, width: 120, direction: 'y', xlabel: 'time (hours)',
        ylabel: 'wins', step: 3, xmax: 4});

    playchart.bucketize(timestamps, contest.start.getTime(), contest.end.getTime());
    winchart.bucketize(wins, contest.start.getTime(), contest.end.getTime());
    playchart.draw();
    winchart.draw();
    test.done();
};


exports['cleanup 5'] = function(test) {
    Bozuko.models.Result.remove(function(err) {
        test.ok(!err);
        test.done();
    });
};

exports['publish 4 hrs / 50 prize contest - again again'] = function(test) {
    contest.start = new Date();
    contest.end = new Date(contest.start.getTime() + 4*hr);
    contest.prizes[0].total = 50;
    var engine = new TimeEngine(contest);
    engine.generateResults(function(err) {
        test.ok(!err);

        Bozuko.models.Result.count(function(err, count) {
            test.equal(count, 50);
            test.done();
        });
    });
};

exports['play out contest - most play in first 2 hours - 100/100/30/10'] = function(test) {
    wins = [];
    timestamps = [];
    var engine = new TimeEngine(contest);
    var start = contest.start.getTime();
    var i = 0;
    for (i = 0; i < 100; i++) {
        timestamps.push(rand(start, start+hr));
    }
    for (i = 0; i < 100; i++) {
	timestamps.push(rand(start+hr, start+hr*2));
    }
    for (i = 0; i < 30; i++) {
	timestamps.push(rand(start+hr*2, start+hr*3));
    }
    for (i = 0; i < 10; i++) {
	timestamps.push(rand(start+hr*3, start+hr*4));
    }

    timestamps.sort(function(a, b) {
        return a - b;
    });

    async.forEachSeries(timestamps, function(timestamp, cb) {
        var memo = {
            timestamp: new Date(timestamp),
            user: user,
            entry: entry
        };
        engine.play(memo, function(err, memo) {
            test.ok(!err);
            if (memo.result) {
		wins.push(timestamp);
            }
            cb(null);
        });
    }, function(err) {
	console.log("total wins = "+wins.length);
	return num_redistributions(function(err, ct) {
	    console.log("lookback window = "+engine.lookback_window/1000+" sec");
	    test.done();
	});
    });
};

exports['graph 4hr contest - most plays in first 2 hours - 100/100/30/10'] = function(test) {
    var playchart = new Chart({height: 20, width: 120, direction: 'y', xlabel: 'time (hours)',
        ylabel: 'plays', step: 3, xmax: 4});
    var winchart = new Chart({height: 20, width: 120, direction: 'y', xlabel: 'time (hours)',
        ylabel: 'wins', step: 3, xmax: 4});

    playchart.bucketize(timestamps, contest.start.getTime(), contest.end.getTime());
    winchart.bucketize(wins, contest.start.getTime(), contest.end.getTime());
    playchart.draw();
    winchart.draw();
    test.done();
};


exports['cleanup 6'] = function(test) {
    Bozuko.models.Result.remove(function(err) {
        test.ok(!err);
        test.done();
    });
};

exports['publish sinusoidal - 12 hrs'] = function(test) {
    contest.start = new Date();
    contest.end = new Date(contest.start.getTime() + 12*hr);
    contest.prizes[0].total = 100;
    var engine = new TimeEngine(contest);
    engine.generateResults(function(err) {
        test.ok(!err);

        Bozuko.models.Result.count(function(err, count) {
            test.equal(count, 100);
            test.done();
        });
    });
};

exports['play out contest - sinusoidal by hr'] = function(test) {
    wins = [];
    timestamps = [];
    var engine = new TimeEngine(contest);
    var i = 0;
    for (var j = 0; j < 3; j++) {
	var start = contest.start.getTime()+j*4*hr;
	for (i = 0; i < 10; i++) {
	    timestamps.push(rand(start, start+hr));
	}
	for (i = 0; i < 50; i++) {
	    timestamps.push(rand(start+hr, start+hr*2));
	}
	for (i = 0; i < 10; i++) {
	    timestamps.push(rand(start+hr*2, start+hr*3));
	}
    }

    timestamps.sort(function(a, b) {
        return a - b;
    });

    async.forEachSeries(timestamps, function(timestamp, cb) {
        var memo = {
            timestamp: new Date(timestamp),
            user: user,
            entry: entry
        };
        engine.play(memo, function(err, memo) {
            test.ok(!err);
            if (memo.result) {
		wins.push(timestamp);
            }
            cb(null);
        });
    }, function(err) {
	console.log("total wins = "+wins.length);
	return num_redistributions(function(err, ct) {
	    console.log("lookback window = "+engine.lookback_window/1000+" sec");
	    test.done();
	});
    });
};

exports['graph sinusoidal - 12 hrs'] = function(test) {
    var playchart = new Chart({height: 20, width: 120, direction: 'y', xlabel: 'time (hours)',
        ylabel: 'plays', step: 3, xmax: 12});
    var winchart = new Chart({height: 20, width: 120, direction: 'y', xlabel: 'time (hours)',
        ylabel: 'wins', step: 3, xmax: 12});

    playchart.bucketize(timestamps, contest.start.getTime(), contest.end.getTime());
    winchart.bucketize(wins, contest.start.getTime(), contest.end.getTime());
    playchart.draw();
    winchart.draw();
    test.done();
};

exports['cleanup 7'] = function(test) {
    Bozuko.models.Result.remove(function(err) {
        test.ok(!err);
        test.done();
    });
};

exports['publish 4 hrs / 50 prize contest - reverse RRS'] = function(test) {
    contest.start = new Date();
    contest.end = new Date(contest.start.getTime() + 4*hr);
    contest.prizes[0].total = 50;
    var engine = new TimeEngine(contest);
    engine.generateResults(function(err) {
        test.ok(!err);

        Bozuko.models.Result.count(function(err, count) {
            test.equal(count, 50);
            test.done();
        });
    });
};

exports['play out contest - most play in last 2 hours - 0/0/50/10'] = function(test) {
    wins = [];
    timestamps = [];
    var engine = new TimeEngine(contest);
    var start = contest.start.getTime();
    var i = 0;
    for (i = 0; i < 50; i++) {
	timestamps.push(rand(start+hr*2, start+hr*3));
    }
    for (i = 0; i < 10; i++) {
	timestamps.push(rand(start+hr*3, start+hr*4));
    }

    timestamps.sort(function(a, b) {
        return a - b;
    });

    async.forEachSeries(timestamps, function(timestamp, cb) {
        var memo = {
            timestamp: new Date(timestamp),
            user: user,
            entry: entry
        };
        engine.play(memo, function(err, memo) {
            test.ok(!err);
            if (memo.result) {
		wins.push(timestamp);
            }
            cb(null);
        });
    }, function(err) {
	return num_redistributions(function(err, ct) {
	    console.log("total wins = "+wins.length);
	    console.log("lookback window = "+engine.lookback_window/1000+" sec");
	    test.done();
	});
    });
};

exports['graph 4hr contest - most plays in last 2 hours - 0/0/50/10'] = function(test) {
    var playchart = new Chart({height: 20, width: 120, direction: 'y', xlabel: 'time (hours)',
        ylabel: 'plays', step: 3, xmax: 4});
    var winchart = new Chart({height: 20, width: 120, direction: 'y', xlabel: 'time (hours)',
        ylabel: 'wins', step: 3, xmax: 4});

    playchart.bucketize(timestamps, contest.start.getTime(), contest.end.getTime());
    winchart.bucketize(wins, contest.start.getTime(), contest.end.getTime());
    playchart.draw();
    winchart.draw();
    test.done();
};

exports['cleanup 8'] = function(test) {
    Bozuko.models.Result.remove(function(err) {
        test.ok(!err);
        test.done();
    });
};

exports['publish 4 hrs / 3 prize contest - sparse crappy game'] = function(test) {
    contest.start = new Date();
    contest.end = new Date(contest.start.getTime() + 4*hr);
    contest.prizes[0].total = 3;
    var engine = new TimeEngine(contest);
    engine.generateResults(function(err) {
        test.ok(!err);

        Bozuko.models.Result.count(function(err, count) {
            test.equal(count, 3);
            test.done();
        });
    });
};

exports['play out contest - sparse prizes/sparse play'] = function(test) {
    wins = [];
    timestamps = [];
    var engine = new TimeEngine(contest);
    var start = contest.start.getTime();
    var i = 0;
    for (i = 0; i < 10; i++) {
	timestamps.push(rand(start, start+hr*4));
    }
    timestamps.sort(function(a, b) {
        return a - b;
    });

    async.forEachSeries(timestamps, function(timestamp, cb) {
        var memo = {
            timestamp: new Date(timestamp),
            user: user,
            entry: entry
        };
        engine.play(memo, function(err, memo) {
            test.ok(!err);
            if (memo.result) {
		wins.push(timestamp);
            }
            cb(null);
        });
    }, function(err) {
	return num_redistributions(function(err, ct) {
	    console.log("total wins = "+wins.length);
	    console.log("lookback window = "+engine.lookback_window/1000+" sec");
	    test.done();
	});
    });
};

exports['graph 4hr contest - sparse prizes/play'] = function(test) {
    var playchart = new Chart({height: 20, width: 120, direction: 'y', xlabel: 'time (hours)',
        ylabel: 'plays', step: 3, xmax: 4});
    var winchart = new Chart({height: 20, width: 120, direction: 'y', xlabel: 'time (hours)',
        ylabel: 'wins', step: 3, xmax: 4});

    playchart.bucketize(timestamps, contest.start.getTime(), contest.end.getTime());
    winchart.bucketize(wins, contest.start.getTime(), contest.end.getTime());
    playchart.draw();
    winchart.draw();
    test.done();
};

exports['cleanup 9'] = function(test) {
    Bozuko.models.Result.remove(function(err) {
        test.ok(!err);
        test.done();
    });
};

exports['4 hrs - 50 prizes - 0/25/50/100'] = function(test) {
    contest.start = new Date();
    contest.end = new Date(contest.start.getTime() + 4*hr);
    contest.prizes[0].total = 50;
    var engine = new TimeEngine(contest);
    engine.generateResults(function(err) {
        test.ok(!err);

        Bozuko.models.Result.count(function(err, count) {
            test.equal(count, 50);
            test.done();
        });
    });
};

exports['play out contest - 4 hrs - 50 prizes - 0/25/50/100'] = function(test) {
    wins = [];
    timestamps = [];
    var engine = new TimeEngine(contest);
    var start = contest.start.getTime();
    var i = 0;
    for (i = 0; i < 25; i++) {
	timestamps.push(rand(start+hr, start+hr*2));
    }
    for (i = 0; i < 50; i++) {
	timestamps.push(rand(start+hr*2, start+hr*3));
    }
    for (i = 0; i < 100; i++) {
	timestamps.push(rand(start+hr*3, start+hr*4));
    }

    timestamps.sort(function(a, b) {
        return a - b;
    });

    async.forEachSeries(timestamps, function(timestamp, cb) {
        var memo = {
            timestamp: new Date(timestamp),
            user: user,
            entry: entry
        };
        engine.play(memo, function(err, memo) {
            test.ok(!err);
            if (memo.result) {
		wins.push(timestamp);
            }
            cb(null);
        });
    }, function(err) {
	return num_redistributions(function(err, ct) {
	    console.log("total wins = "+wins.length);
	    console.log("lookback window = "+engine.lookback_window/1000+" sec");
	    test.done();
	});
    });
};

exports['graph 4hr contest - 50 prizes - 0/25/50/100'] = function(test) {
    var playchart = new Chart({height: 20, width: 120, direction: 'y', xlabel: 'time (hours)',
        ylabel: 'plays', step: 3, xmax: 4});
    var winchart = new Chart({height: 20, width: 120, direction: 'y', xlabel: 'time (hours)',
        ylabel: 'wins', step: 3, xmax: 4});

    playchart.bucketize(timestamps, contest.start.getTime(), contest.end.getTime());
    winchart.bucketize(wins, contest.start.getTime(), contest.end.getTime());
    playchart.draw();
    winchart.draw();
    test.done();
};


exports['cleanup 10'] = function(test) {
    Bozuko.models.Result.remove(function(err) {
        test.ok(!err);
        test.done();
    });
};

exports['4 hrs - 50 prizes - 0/50/50/0'] = function(test) {
    contest.start = new Date();
    contest.end = new Date(contest.start.getTime() + 4*hr);
    contest.prizes[0].total = 50;
    var engine = new TimeEngine(contest);
    engine.generateResults(function(err) {
        test.ok(!err);

        Bozuko.models.Result.count(function(err, count) {
            test.equal(count, 50);
            test.done();
        });
    });
};

exports['play out contest - 4 hrs - 50 prizes - 0/50/50/0'] = function(test) {
    wins = [];
    timestamps = [];
    var engine = new TimeEngine(contest);
    var start = contest.start.getTime();
    var i = 0;
    for (i = 0; i < 50; i++) {
	timestamps.push(rand(start+hr, start+hr*2));
    }
    for (i = 0; i < 50; i++) {
	timestamps.push(rand(start+hr*2, start+hr*3));
    }

    timestamps.sort(function(a, b) {
        return a - b;
    });

    async.forEachSeries(timestamps, function(timestamp, cb) {
        var memo = {
            timestamp: new Date(timestamp),
            user: user,
            entry: entry
        };
        engine.play(memo, function(err, memo) {
            test.ok(!err);
            if (memo.result) {
		wins.push(timestamp);
            }
            cb(null);
        });
    }, function(err) {
	return num_redistributions(function(err, ct) {
	    console.log("total wins = "+wins.length);
	    console.log("lookback window = "+engine.lookback_window/1000+" sec");
	    test.done();
	});
    });
};

exports['graph 4hr contest - 50 prizes - 0/50/50/0'] = function(test) {
    var playchart = new Chart({height: 20, width: 120, direction: 'y', xlabel: 'time (hours)',
        ylabel: 'plays', step: 3, xmax: 4});
    var winchart = new Chart({height: 20, width: 120, direction: 'y', xlabel: 'time (hours)',
        ylabel: 'wins', step: 3, xmax: 4});

    playchart.bucketize(timestamps, contest.start.getTime(), contest.end.getTime());
    winchart.bucketize(wins, contest.start.getTime(), contest.end.getTime());
    playchart.draw();
    winchart.draw();
    test.done();
};

exports['cleanup 11'] = function(test) {
    Bozuko.models.Result.remove(function(err) {
        test.ok(!err);
        test.done();
    });
};

exports['4 hrs - 50 prizes - 100/100/100/100'] = function(test) {
    contest.start = new Date();
    contest.end = new Date(contest.start.getTime() + 4*hr);
    contest.prizes[0].total = 50;
    var engine = new TimeEngine(contest);
    engine.generateResults(function(err) {
        test.ok(!err);

        Bozuko.models.Result.count(function(err, count) {
            test.equal(count, 50);
            test.done();
        });
    });
};

exports['play out contest - 4hrs - 50 prizes - 100/100/100/100'] = function(test) {
    wins = [];
    timestamps = [];
    var engine = new TimeEngine(contest);
    var start = contest.start.getTime();
    var i = 0;
    for (i = 0; i < 100; i++) {
	timestamps.push(rand(start, start+hr));
    }
    for (i = 0; i < 100; i++) {
	timestamps.push(rand(start+hr, start+hr*2));
    }
    for (i = 0; i < 100; i++) {
	timestamps.push(rand(start+hr*2, start+hr*3));
    }
    for (i = 0; i < 100; i++) {
	timestamps.push(rand(start+hr*3, start+hr*4));
    }

    timestamps.sort(function(a, b) {
        return a - b;
    });

    async.forEachSeries(timestamps, function(timestamp, cb) {
        var memo = {
            timestamp: new Date(timestamp),
            user: user,
            entry: entry
        };
        engine.play(memo, function(err, memo) {
            test.ok(!err);
            if (memo.result) {
		wins.push(timestamp);
            }
            cb(null);
        });
    }, function(err) {
	return num_redistributions(function(err, ct) {
	    console.log("total wins = "+wins.length);
	    console.log("lookback window = "+engine.lookback_window/1000+" sec");
	    test.done();
	});
    });
};

exports['graph 4hr contest - 50 prizes - 100/100/100/100'] = function(test) {
    var playchart = new Chart({height: 20, width: 120, direction: 'y', xlabel: 'time (hours)',
        ylabel: 'plays', step: 3, xmax: 4});
    var winchart = new Chart({height: 20, width: 120, direction: 'y', xlabel: 'time (hours)',
        ylabel: 'wins', step: 3, xmax: 4});

    playchart.bucketize(timestamps, contest.start.getTime(), contest.end.getTime());
    winchart.bucketize(wins, contest.start.getTime(), contest.end.getTime());
    playchart.draw();
    winchart.draw();
    test.done();
};

exports['cleanup 12'] = function(test) {
    Bozuko.models.Result.remove(function(err) {
        test.ok(!err);
        test.done();
    });
};

exports['4 hrs - 100 prizes - 50/25/10/100'] = function(test) {
    contest.start = new Date();
    contest.end = new Date(contest.start.getTime() + 4*hr);
    contest.prizes[0].total = 100;
    var engine = new TimeEngine(contest);
    engine.generateResults(function(err) {
        test.ok(!err);

        Bozuko.models.Result.count(function(err, count) {
            test.equal(count, 100);
            test.done();
        });
    });
};

exports['play out contest - 4hrs - 100 prizes - 50/25/10/100'] = function(test) {
    wins = [];
    timestamps = [];
    var engine = new TimeEngine(contest);
    var start = contest.start.getTime();
    var i = 0;
    for (i = 0; i < 50; i++) {
	timestamps.push(rand(start, start+hr));
    }
    for (i = 0; i < 25; i++) {
	timestamps.push(rand(start+hr, start+hr*2));
    }
    for (i = 0; i < 10; i++) {
	timestamps.push(rand(start+hr*2, start+hr*3));
    }
    for (i = 0; i < 100; i++) {
	timestamps.push(rand(start+hr*3, start+hr*4));
    }

    timestamps.sort(function(a, b) {
        return a - b;
    });

    async.forEachSeries(timestamps, function(timestamp, cb) {
        var memo = {
            timestamp: new Date(timestamp),
            user: user,
            entry: entry
        };
        engine.play(memo, function(err, memo) {
            test.ok(!err);
            if (memo.result) {
		wins.push(timestamp);
            }
            cb(null);
        });
    }, function(err) {
	return num_redistributions(function(err, ct) {
	    console.log("total wins = "+wins.length);
	    console.log("lookback window = "+engine.lookback_window/1000+" sec");
	    test.done();
	});
    });
};

exports['graph 4hr contest - 100 prizes - 50/25/10/100'] = function(test) {
    var playchart = new Chart({height: 20, width: 120, direction: 'y', xlabel: 'time (hours)',
        ylabel: 'plays', step: 3, xmax: 4});
    var winchart = new Chart({height: 20, width: 120, direction: 'y', xlabel: 'time (hours)',
        ylabel: 'wins', step: 3, xmax: 4});

    playchart.bucketize(timestamps, contest.start.getTime(), contest.end.getTime());
    winchart.bucketize(wins, contest.start.getTime(), contest.end.getTime());
    playchart.draw();
    winchart.draw();
    test.done();
};

exports['cleanup 13'] = function(test) {
    Bozuko.models.Result.remove(function(err) {
        test.ok(!err);
        test.done();
    });
};

exports['4 hrs - 1 prize - 0/0/0/1'] = function(test) {
    contest.start = new Date();
    contest.end = new Date(contest.start.getTime() + 4*hr);
    contest.prizes[0].total = 1;
    var engine = new TimeEngine(contest);
    engine.generateResults(function(err) {
        test.ok(!err);

        Bozuko.models.Result.count(function(err, count) {
            test.equal(count, 1);
            test.done();
        });
    });
};

exports['play out contest - 1 prize - 0/0/0/1'] = function(test) {
    wins = [];
    timestamps = [];
    var engine = new TimeEngine(contest);
    var start = contest.start.getTime();
    timestamps.push(rand(start+hr*3, start+hr*4));

    async.forEachSeries(timestamps, function(timestamp, cb) {
        var memo = {
            timestamp: new Date(timestamp),
            user: user,
            entry: entry
        };
        engine.play(memo, function(err, memo) {
            test.ok(!err);
            if (memo.result) {
		wins.push(timestamp);
            }
            cb(null);
        });
    }, function(err) {
	return num_redistributions(function(err, ct) {
	    console.log("total wins = "+wins.length);
	    console.log("lookback window = "+engine.lookback_window/1000+" sec");
	    test.done();
	});
    });
};

exports['graph 4hr contest - 1 prize - 0/0/0/1'] = function(test) {
    var playchart = new Chart({height: 20, width: 120, direction: 'y', xlabel: 'time (hours)',
        ylabel: 'plays', step: 3, xmax: 4});
    var winchart = new Chart({height: 20, width: 120, direction: 'y', xlabel: 'time (hours)',
        ylabel: 'wins', step: 3, xmax: 4});

    playchart.bucketize(timestamps, contest.start.getTime(), contest.end.getTime());
    winchart.bucketize(wins, contest.start.getTime(), contest.end.getTime());
    playchart.draw();
    winchart.draw();
    test.done();
};
