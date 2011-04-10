var testsuite = require('./config/testsuite');
var async = require('async');
var util = require('util');

var start = new Date();
var end = new Date();
end.setTime(start.getTime()+1000*60*60*24*2);

var user = new Bozuko.models.User(
{
    id: '32423432523',
    name: 'Charlie Sheen',
    first_name: 'Charlie',
    last_name: 'Sheen',
    email: 'cs@winning.com',
    token: 'dfasaa33345353453543',
    gender: 'male'
});

var page = new Bozuko.models.Page();

var contest = new Bozuko.models.Contest(
{
    game: 'slots',
    game_config: {
        icons: ['seven','bar','bozuko','banana','monkey','cherries']
    },
    entry_config: [{
        type: "facebook/checkin",
        tokens: 3
    }],
    start: start,
    end: end,
    total_entries: 1,
    total_plays: 3,
    play_cursor: -1,
    token_cursor: -1
});
contest.prizes.push({
    name: 'Wicked cool T-Shirt',
    value: '20',
    description: "Awesome Owl Watch T-Shirt",
    details: "Only available in Large or Extra-large",
    instructions: "Show this screen to an employee",
    total: 2
});
contest.prizes.push({
    name: 'Owl Watch Mug',
    value: '10',
    description: "Sweet travel Mug",
    details: "Not good for drinking out of.",
    instructions: "Show this screen to an employee",
    total: 10
});

var checkin = new Bozuko.models.Checkin();
checkin.timestamp = new Date();

var entry;

exports['save page'] = function(test) {
    page.save(function(err) {
        test.ok(!err);
        test.done();
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

exports['save checkin'] = function(test) {
    checkin.user_id = user._id;
    checkin.page_id = page._id;
    checkin.save(function(err) {
        test.ok(!err);
        test.done();
    });

};

exports['generate contest results'] = function(test) {
    contest.generateResults(function(err, results) {
        test.ok(!err);
        test.done();
    });
};

exports['enter contest'] = function(test) {
    var entryMethod = Bozuko.entry('facebook/checkin', user, {checkin: checkin});
    contest.enter(entryMethod, function(err, e) {
        test.ok(!err);
        entry = e;
        test.done();
    });
};

exports['increment play cursor'] = function(test) {
    var _cursor = contest.play_cursor;
    contest.incrementPlayCursor(function(err, cursor) {
        test.equal(cursor, _cursor +1);
        Bozuko.models.Contest.findOne({_id: contest._id}, function(err, c) {
            test.ok(!err);
            test.deepEqual(cursor+0, c.play_cursor+0);

            // reset cursor to old value for next test
            c.play_cursor = _cursor;
            c.save(function(err) {
                test.ok(!err);
                test.done();
            });
        });
    });
};

function increment_play_cursor(callback) {
    contest.incrementPlayCursor(function(err, cursor) {
        callback(err);
    });
};

exports['increment play cursor 3 times async parallel'] = function(test) {
    var ipc = increment_play_cursor;
    async.parallel([ipc, ipc, ipc], function(err, results) {
        test.ok(!err);
        Bozuko.models.Contest.findOne({_id: contest._id}, function(err, c) {
            test.ok(!err);
            test.deepEqual(c.play_cursor+0, 2);
            test.done();
        });
    });
};

exports['fail to increment play cursor - no more plays'] = function(test) {
    contest.incrementPlayCursor(function(err, cursor) {
        test.ok(err);
        Bozuko.models.Contest.findOne({_id: contest._id}, function(err, c) {
            test.ok(!err);
            test.deepEqual(c.play_cursor+0, 2);
            test.done();
        });
    });
};

exports['restore play cursor'] = function(test) {
    contest.play_cursor = -1;
    contest.save(function(err) {
        test.ok(!err);
        test.done();
    });
};

function play(callback) {
    contest.play(user, function(err, result) {
        callback(err, result);
    });
}

exports['play  3 times'] = function(test) {
    async.parallel([play, play, play], function(err, results) {
        test.ok(!err);
        var res = results[0];
        test.deepEqual(contest._id, res.entry.contest_id);
        test.deepEqual(res.entry.contest_id, res.play.contest_id);
        var gr = res.game_result;
        test.deepEqual(res.play.game, 'slots');
        // are the icons the same ?
        test.deepEqual(gr[0], gr[1]);
        test.deepEqual(gr[1], gr[2]);
        test.done();
    });
};

exports['play fail - no tokens'] = function(test) {
    contest.play(user, function(err, result) {
        test.ok(err);
    });
    Bozuko.models.Contest.findOne({_id: contest._id}, function(err, c) {
        test.ok(!err);
        test.deepEqual(c.play_cursor+0, 2);
        test.done();
    });
};

exports.cleanup = function(test) {
    Bozuko.models.User.remove(function(err) {
        test.ok(!err);
        Bozuko.models.Contest.remove(function(err) {
            test.ok(!err);
            Bozuko.models.Page.remove(function(err) {
                test.ok(!err);
                Bozuko.models.Checkin.remove(function(err) {
                    test.ok(!err);
                    Bozuko.models.Prize.remove(function(err) {
                        test.ok(!err);
                        Bozuko.models.Play.remove(function(err) {
                            test.ok(!err);
                            test.done();
                        });
                    });
                });
            });
        });
    });
};
