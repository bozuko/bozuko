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
    contest.next_contest = contest._id;
    contest.publish(function(err, results) {
        test.ok(!err);
        test.done();
    });
};

exports['enter contest - create second contest as side effect'] = function(test) {
    Bozuko.models.Contest.count({name: 'auto-renew'}, function(err, count) {
        test.ok(!err);
        test.equal(count, 1);
        Bozuko.enter(entry_opts, function(err, game_states) {
            test.ok(!err);
            Bozuko.models.Contest.count({name: 'auto-renew'}, function(err, count) {
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

exports['create, publish and deactivate a third contest'] = function(test) {
    return final_contest.publish(function(err) {
        test.ok(!err);
        final_contest.active = false;
        final_contest.save(function(err) {
            test.ok(!err);
            test.done();
        });
    });
};

exports['set contest2.next_contest to the newly created third contest'] = function(test) {
    Bozuko.models.Contest.findOne({name: 'auto-renew (Copy)'}, function(err, contest2) {
        test.ok(!err);
        contest2.next_contest = final_contest._id;
        contest2.save(function(err) {
            entry_opts.contest = contest2;
            test.ok(!err);
            test.done();
        });
    });
};

exports['enter contest 2 (activate 3rd contest as side effect)'] = function(test) {
    Bozuko.models.Contest.count({name: 'final', active: false}, function(err, count) {
        test.ok(!err);
        test.equal(count, 1);
        Bozuko.enter(entry_opts, function(err, game_states) {
            test.ok(!err);
            Bozuko.models.Contest.count({name: 'final', active: true}, function(err, count) {
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
