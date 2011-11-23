var testsuite = require('./config/testsuite');
var async = require('async');

var start = new Date();
var end = new Date();
end.setTime(+start+(1000*60*60*24*2));

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
var _contest = {
    name: 'bozuko bucks',
    game: 'slots',
    game_config: {
        theme: 'default'
    },
    entry_config: [{
        type: "facebook/checkin",
        tokens: 1,
        duration: 0
    }],
    start: start,
    end: end,
    page_id: page._id,
    win_frequency: 1,
    free_play_pct: 0,
    prizes: [{
        name: 'bozuko bucks',
        value: 1,
        total: 2,
        bucks: 1000
    }]
};
var contest = new Bozuko.models.Contest(_contest);

var entry_opts = {
    type: 'facebook/checkin',
    user: user,
    contest: contest,
    page: page,
    ll: ll
};

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
    contest.save(function(err) {
        test.ok(!err);
        test.done();
    });
};

exports['publish contest'] = function(test) {
    contest.publish(function(err, results) {
        test.ok(!err);
        test.done();
    });
};

exports['enter and play'] = function(test) {
    Bozuko.enter(entry_opts, function(err) {
        test.ok(!err);
        play(function(err) {
            test.ok(!err);
            Bozuko.models.User.findById(user._id, function(err, u) {
                test.ok(!err);
                user = u;
                test.equal(u.bucks, 1000);
                test.done();
            });
        });
    });
};

exports['enter and play again'] = function(test) {
    entry_opts.user = user;
    Bozuko.enter(entry_opts, function(err, game_states) {
        test.ok(!err);
        play(function(err) {
            test.ok(!err);
            Bozuko.models.User.findById(user._id, function(err, u) {
                test.ok(!err);
                test.equal(u.bucks, 2000);
                test.done();
            });
        });
    });
};

exports['save 1000 fake prize records and countBucks'] = function(test) {
    var ct = 0;
    async.whilst(
        function() {
            return ct < 1000;
        },
        function(cb) {
            var prize = new Bozuko.models.Prize({
                user_id: user._id,
                bucks: 1000
            });
            ct++;
            prize.save(cb);
        },
        function(err) {
            test.ok(!err);
            var Profiler = Bozuko.require('util/profiler');
            var prof = new Profiler('count bucks');
            Bozuko.models.Prize.countBucks({user_id: user._id}, function(err, bucks) {
                prof.mark('complete');
                test.ok(!err);
                test.equal(bucks, 1002000);
                test.done();
            });
        }
    );
};

function play(callback) {
    var opts = {
        user: user,
        page_id: page._id,
        timestamp: new Date()
    };
    contest.play(opts, callback);
}

function cleanup(callback) {
    var e = emptyCollection;
    async.parallel([e('User'), e('Contest'), e('Page'), e('Checkin'), e('Play'), e('Prize')], callback);
}

function emptyCollection(name) {
    return function(callback){
        Bozuko.models[name].remove(function(){callback(null, '');});
    };
};
