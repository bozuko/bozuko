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
    name: 'auto-renew',
    game: 'slots',
    game_config: {
        theme: 'default'
    },
    next_contest:[{}],
    entry_config: [{
        type: "facebook/checkin",
        tokens: 3,
        duration: 2
    }],
    start: start,
    end: end,
    page_id: page._id,
    win_frequency: 1,
    free_play_pct: 0,
    prizes: [{
        name: 'delicious food',
        value: 5,
        total: 1
    }]
};

var contest = new Bozuko.models.Contest(_contest);

var final_contest = new Bozuko.models.Contest(_contest);
final_contest.name = 'final';
final_contest.start = new Date(Date.now() + 1000*60*60);

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
    contest.nextContest().contest_id = contest._id;
    contest.publish(function(err, results) {
        test.ok(!err);
        test.done();
    });
};

exports['enter contest - create second contest as side effect'] = function(test) {
    Bozuko.models.Contest.count({name: 'auto-renew', 'next_contest.0.active': false}, function(err, count) {
        test.ok(!err);
        test.equal(count, 1);
        Bozuko.enter(entry_opts, function(err, game_states) {
            test.ok(!err);
            Bozuko.models.Contest.count({name: 'auto-renew', 'next_contest.0.active': true}, function(err, count) {
                test.ok(!err);
                test.equal(count, 1);
                Bozuko.models.Contest.count({name: 'auto-renew (Copy)'}, function(err, count) {
                    test.equal(count, 1);
                    test.done();
                });
            });
        });
    });
};

exports['play out contest'] = function(test) {
    async.series([play, play, play], function(err, results) {
        test.ok(!err);
        test.done();
    });
};

exports['create and publish a third contest'] = function(test) {
    return final_contest.publish(function(err) {
        test.ok(!err);
        test.done();
    });
};

exports['set contest2.nextContest().contest_id to the newly created third contest'] = function(test) {
    Bozuko.models.Contest.findOne({name: 'auto-renew (Copy)'}, function(err, contest2) {
        test.ok(!err);
        contest2.nextContest().contest_id = final_contest._id;
        contest2.save(function(err) {
            entry_opts.contest = contest2;
            test.ok(!err);
            test.done();
        });
    });
};

exports['enter contest 2 (activate 3rd contest as side effect)'] = function(test) {
    var testdate = new Date(Date.now() + 5000);
    Bozuko.models.Contest.count({name: 'final', start: {$gt: testdate}}, function(err, count) {
        test.ok(!err);
        test.equal(count, 1);
        Bozuko.enter(entry_opts, function(err, game_states) {
            test.ok(!err);
            // entry causes the 2nd contest to finish and bumps up the start date of the nextContest().contest_id
            Bozuko.models.Contest.count({name: 'final', start: {$lt: testdate}}, function(err, count) {
                test.ok(!err);
                test.equal(count, 1);
                test.done();
            });
        });
    });
};

exports['enter final contest - ensure still only 3 contests'] =  function(test) {
    entry_opts.contest = final_contest;
    Bozuko.enter(entry_opts, function(err) {
        test.ok(!err);
        Bozuko.models.Contest.count({}, function(err, count) {
            test.ok(!err);
            test.equal(count, 3);
            test.done();
        });
    });
};

var expiring_contest = new Bozuko.models.Contest(_contest);

exports['publish a contest that expires by time'] = function(test) {
    expiring_contest.name = 'expiring';
    expiring_contest.nextContest().contest_id = expiring_contest._id;
    expiring_contest.end = new Date(Date.now() + 1000*60*60);
    expiring_contest.publish(function(err, results) {
        test.ok(!err);
        Bozuko.models.Contest.count({}, function(err, count) {
            test.ok(!err);
            test.equal(count, 4);
        });
        test.done();
    });
};

var expiring_contest_end = null;
exports['ensure a new contest is created via autoRenew with start date at end of last contest'] = function(test) {
    Bozuko.models.Contest.autoRenew(function(err) {
        test.ok(!err);
        Bozuko.models.Contest.findOne({name: 'expiring (Copy)'}, function(err, c) {
            test.ok(!err);
            test.equal(c.start.getTime(), expiring_contest.end.getTime());
            expiring_contest_end = expiring_contest.end;
            // Put the end date of this contest outside the one day window so the next call
            // to autoRenew doesn't create another contest
            c.end = new Date(Date.now()+1000*60*60*25);
            c.save(function(err) {
                test.ok(!err);
                Bozuko.models.Contest.count({}, function(err, count) {
                    test.ok(!err);
                    test.equal(count, 5);
                    test.done();
                });
            });
        });
    });
};

exports['ensure another contest isn\'t created when autoRenew is called again'] = function(test) {
    Bozuko.models.Contest.autoRenew(function(err) {
        test.ok(!err);
        Bozuko.models.Contest.findOne({name: 'expiring (Copy)'}, function(err, c) {
            // Ensure the time of the created contest didn't change
            test.equal(expiring_contest_end.getTime(), c.start.getTime());
            Bozuko.models.Contest.count({}, function(err, count) {
                test.ok(!err);
                test.equal(count, 5);
                test.done();
            });
        });
    });
};

exports['enter the contest that is about to expire - ensure another contest is not created'] = function(test) {
    entry_opts.contest = expiring_contest;
    Bozuko.enter(entry_opts, function(err) {
        test.ok(!err);
        Bozuko.models.Contest.count({}, function(err, count) {
            test.ok(!err);
            test.equal(count, 5);
            Bozuko.models.Contest.findOne({name: 'expiring (Copy)'}, function(err, c) {
                // Ensure that the time for the active next_contest is bumped up to now, since the contest
                // just ended due to entries and the start date is in the future
                test.ok(c.start.getTime() <= Date.now());
                test.ok(c.start.getTime() <= expiring_contest_end.getTime());
                test.done();
            });
        });
    });
};

exports['fail to enter the expiring contest - no tokens'] = function(test) {
    Bozuko.enter(entry_opts, function(err) {
        test.ok(err);
        test.done();
    });
};


function play(callback) {
    var opts = {
        user: user,
        page_id: page._id,
        timestamp: new Date()
    };
    contest.play(opts, function(err, result) {
        callback(err, result);
    });
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
