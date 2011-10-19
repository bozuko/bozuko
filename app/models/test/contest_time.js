var testsuite = require('./config/testsuite');
var async = require('async');
var inspect = require('util').inspect;

var start = new Date().getTime();
var end = new Date();
end.setTime(start+(10000));

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
        tokens: 1000,
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

var results;
exports['generate contest results'] = function(test) {
    contest.generateResults(function(err, _results) {
        test.ok(!err);
        results = _results;
        test.done();
    });
};

exports['enter contest'] = function(test) {
    var entryMethod = Bozuko.entry('facebook/checkin', user, {ll:ll});
    contest.enter(entryMethod, function(err, e) {
        test.ok(!err);
        if( err ) console.log(err.stack);
        entry = e;
        test.done();
    });
};

var engine = contest.getEngine();

var avg_step;

exports['calculate average step'] = function(test) {
    engine.averageStep(contest._id, function(err, data) {
        test.ok(!err);
        test.equal(data.avg_step, engine.avg_step);
        console.log("average step = "+data.avg_step);
        results = data.results;
        avg_step = data.avg_step;
        test.done();
    });
};

exports['play out contest with all wins'] = function(test) {
    var numPrizes = contest.prizes[0].total;
    var wins = 0;
    results.sort(function(a, b) {
        return a.timestamp.getTime() - b.timestamp.getTime();
    });
    async.forEachSeries(results,
        function(result, callback) {
            var memo = {
                contest: contest,
                user: user,
                timestamp: new Date(result.timestamp.getTime()+Math.floor(engine.lookback_window/2))
            };                
            contest.play(memo, function(err, memo) {
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
        contest.play(user, function(err, memo) {
            i++;
            test.ok(!err);
            test.ok(!memo.result);
            return cb(null);
        });
    }, function(err) {
        test.done();
    });
};

exports['calculate average step - 0 because no more results available'] = function(test) {
    engine.averageStep(contest._id, function(err, data) {
        test.ok(!err);
        test.equal(data.avg_step, engine.avg_step);
        console.log("average step = "+data.avg_step);
        results = data.results;
        avg_step = data.avg_step;
        test.equal(avg_step, 0);
        test.done();
    });
};

exports['reset contest'] = function(test) {
    Bozuko.models.Result.remove(function(){
        exports['generate contest results'](test);
    });
};

exports['play out contest - staggered'] = function(test) {
};

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