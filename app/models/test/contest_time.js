var testsuite = require('./config/testsuite');
var async = require('async');
var inspect = require('util').inspect;
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

var contest = new Bozuko.models.Contest(
{
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
    free_play_pct: 0

});
contest.prizes.push({
    name: 'DBC $10 giftcard',
    value: '0',
    description: 'Gonna create some sick desynes fer you',
    details: 'Don\'t worry, you won\'t make money off this',
    instructions: 'Check yer email fool!',
    total: 100,
    won: 0,
    redeemed: 0,
    is_email: false
});

var entry_opts = {
    type: 'facebook/checkin',
    user: user,
    contest: contest,
    page: page,
    ll: ll
};


var entry;

exports['save page'] = function(test) {
    cleanup(function() {
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

exports['generate contest results'] = function(test) {
    contest.generateResults(function(err) {
        test.ok(!err);
        test.done();
    });
};

exports['enter contest'] = function(test) {
    Bozuko.enter(entry_opts, function(err, rv) {
        test.ok(!err);
        entry = rv.entry;
        test.done();
    });
};

var engine = contest.getEngine();
var results;

exports['get results'] = function(test) {
    Bozuko.models.Result.find({contest_id: contest._id}, function(err, res) {
        test.ok(!err);
        results = res;
        test.done();
    });
};

exports['play out contest with all wins'] = function(test) {
    results.sort(function(a, b) {
        return a.timestamp.getTime() - b.timestamp.getTime();
    });
    async.forEachSeries(results,
        function(result, callback) {
            var opts = {
                page_id: page._id,
                user: user,
                timestamp: new Date(result.timestamp.getTime()+Math.floor(engine.lookback_window/2))
            };
            contest.play(opts, function(err, memo) {
                test.ok(!err);
                test.ok(memo.result);
                return callback(err, memo);
            });
        }, function(err) {
            test.done();
        }
    );
};

exports['play 10 more times and lose'] = function(test) {
    var i = 0;
    async.whilst(function() {
        return i < 10;
    }, function(cb) {
        var opts = {
            page_id: page.id,
            user: user,
            timestamp: new Date(results[results.length-1].timestamp.getTime()+i*100)
        };
        contest.play(opts, function(err, memo) {
            i++;
            test.ok(!err);
            test.ok(!memo.result);
            return cb(null);
        });
    }, function(err) {
        test.done();
    });
};

exports['create 5 day contest - 1 prize/hr'] = function(test) {
    contest.prizes[0].total = 24*5;
    contest.start = new Date(Date.now() - day*5);
    contest.end = new Date(contest.start.getTime()+1000*60*60*24*5);
    engine.configure();
    Bozuko.models.Result.remove(function(){
        exports['generate contest results'](test);
    });
};

// play memo.pph*memo.hrs plays
function enter_and_play(memo, callback) {
    var test = memo.test;
    var plays = memo.hrs*memo.pph;
    var start = memo.start;
    var end = memo.start+hr*memo.hrs;
    var timestamps = [];
    for (var i = 0; i < plays; i++) {
        timestamps.push(new Date(rand(start,end)));
    }
    timestamps.sort(function(a, b) {
        return a.getTime() - b.getTime();
    });
    memo.plays = memo.plays.concat(timestamps);
    var wins = 0;
    var losses = 0;

    var ct = 0;
    return async.forEachSeries(timestamps, function(ts, cb) {
        // must change entry time so we can actually play. We can't just re-enter
        // because that uses the actual current time not our fake play time
        //
        entry.timestamp = new Date(ts.getTime()-10);
        entry.save(function(err) {
            test.ok(!err);
            var m = {
                page_id: page._id,
                user: user,
                timestamp: ts
            };
            return contest.play(m, function(err, result) {
                if (err) return cb(err);
                if (result.result) {
                    console.log("memo.wins.length = "+memo.wins.length);
                    memo.wins.push(ts);
                    wins++;
                } else {
                    losses++;
                }
                return cb(null, result);
            });
        });
    },function(err) {
        test.ok(!err);
        test.equal(plays, wins+losses);
        return callback(err, memo);
    });
}

function play_one_day(memo, callback) {
    async.series({
        '0-2': function(cb) {
            memo.hrs = 2;
            memo.pph = 2;
            enter_and_play(memo, cb);
        },
        '2-6': function(cb) {
            memo.start += hr*2;
            memo.pph = 1;
            memo.hrs = 4;
            enter_and_play(memo, cb);
        },
        '6-8': function(cb) {
            memo.start += hr*4;
            memo.pph = 4;
            memo.hrs = 2;
            enter_and_play(memo, cb);
        },
        '8-12': function(cb) {
            memo.start += hr* 2;
            memo.pph = 10;
            memo.hrs = 4;
            enter_and_play(memo, cb);
        },
        '12-20': function(cb) {
            memo.start += hr*4;
            memo.pph = 30;
            memo.hrs = 8;
            enter_and_play(memo, cb);
        },
        '20-24': function(cb) {
            memo.start += hr*8;
            memo.pph = 5;
            memo.hrs = 4;
            enter_and_play(memo, cb);
        }
    }, function(err, results) {
        return callback(err, memo);
    });

};

exports['play out contest - staggered'] = function(test) {
    var memo = {
        test: test,
        plays: [],
        wins: []
    };

    var day_ct = 0;
    async.whilst(
        function() {
            return day_ct < 5;
        },
        function(cb) {
            memo.start = contest.start.getTime()+day*day_ct;
            play_one_day(memo, function(err, results) {
                test.ok(!err);
                test.ok(results);
                test.deepEqual(memo, results);
                day_ct++;
                cb(err);
            });
        },
        function(err) {
            process.stdout.write('\n');
            test.equal(memo.wins.length, 120);
            graph_plays(contest.start.getTime(), memo.plays);
            graph_wins(contest.start.getTime(), memo.wins);
            test.ok(!err);
            test.done();
        }
    );
};

function graph_plays(start, plays) {
    var chart = new Chart({height: 40, width: 120, direction: 'y', xlabel: 'time (hrs)', ylabel: 'plays', step: 1});
    var buckets = [];
    var cursor = 0;
    for (var i = 0; i < 24*5; i++) {
        buckets[i] = 0;
        while (cursor < plays.length) {
            if (plays[cursor].getTime() >= start+hr*i && plays[cursor].getTime() < start+hr*(i+1)) {
                buckets[i]++;
                cursor++;
            } else {
                chart.addBar({size: buckets[i]});
                break;
            }
        }
    }
    chart.draw();
}

function graph_wins(start, wins) {
    var chart = new Chart({height: 10, width: 120, direction: 'y', xlabel: 'time (hrs)', ylabel: 'wins', step: 1});
    var buckets = [];
    var cursor = 0;
    for (var i = 0; i < 24*5; i++) {
        buckets[i] = 0;
        while (cursor < wins.length) {
            if (wins[cursor].getTime() >= start+hr*i && wins[cursor].getTime() < start+hr*(i+1)) {
                buckets[i]++;
                cursor++;
            } else {
                chart.addBar({size: buckets[i]});
                break;
            }
        }
    }
    chart.draw();
}

function cleanup(callback) {
    var e = emptyCollection;
    async.parallel([e('User'), e('Entry'), e('Contest'), e('Page'), e('Checkin'), e('Play'), e('Prize'),
        e('Result')], callback);
}

function emptyCollection(name) {
    return function(callback){
        Bozuko.models[name].remove(function(){callback(null, '');});
    };
};
