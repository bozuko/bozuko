var testsuite = require('./config/testsuite');
var async = require('async');
var uuid = require('node-uuid');

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

var contest = new Bozuko.models.Contest(
{
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
    win_frequency: 1,
    free_play_pct: 50,
    total_entries: 1
});
contest.prizes.push({
    name: 'DBC $10 giftcard',
    value: '0',
    description: 'Gonna create some sick desynes fer you',
    details: 'Don\'t worry, you won\'t make money off this',
    instructions: 'Check yer email fool!',
    total: 1,
    won: 0,
    redeemed: 0,
    is_email: true,
    email_body: 'Give the gift code to the proprietor and watch him amaze you!',
    email_codes: ["15h1ttyd3s1gn"]
});

var checkin = new Bozuko.models.Checkin();
checkin.timestamp = new Date();

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

exports['save checkin'] = function(test) {
    checkin.user_id = user._id;
    checkin.page_id = page._id;
    checkin.save(function(err) {
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

exports['enter contest'] = function(test) {
    var entryMethod = Bozuko.entry('facebook/checkin', user, {checkin: checkin});
    contest.enter(entryMethod, function(err, e) {
        test.ok(!err);
        if( err ) console.log(err.stack);
        entry = e;
        test.done();
    });
};

exports['enter contest fail - no tokens'] = function(test) {
  var entryMethod = Bozuko.entry('facebook/checkin', user, {checkin: checkin});
    contest.enter(entryMethod, function(err, e) {
        console.log(err);
        test.ok(err);
        test.done();
    });
};

var free_play = false;

function play(callback) {
    contest.play(user, function(err, result) {
        if (result.play.free_play) free_play = true;
        callback(err, result);
    });
}

exports['play  3 times'] = function(test) {
    async.series([play, play, play], function(err, results) {
        test.ok(!err);
        var res = results[0];
        test.deepEqual(res.play.game, 'slots');
        test.deepEqual(res.play.play_cursor+0, 0);
        test.deepEqual(results[1].play.play_cursor+0, 1);
        test.deepEqual(results[2].play.play_cursor+0, 2);

        Bozuko.models.Contest.findOne({_id: contest._id}, function(err, c) {
            test.equal(c.plays.length, 0);
            test.done();
        });
    });
};

exports['use free play if won'] = function(test) {
    if (!free_play) return test.done();

    console.log("Congratulations: You won a free play!");

    play(function(err, result) {
        test.equal(3, result.play.play_cursor);
        test.done();
    });
};

exports['play fail - no tokens'] = function(test) {
    contest.play(user._id, function(err, result) {
        test.ok(err);
        var play_cursor = free_play ? 3 : 2;
        Bozuko.models.Contest.findOne({_id: contest._id}, function(err, c) {
            test.ok(!err);
            test.deepEqual(c.play_cursor+0, play_cursor);
            test.equal(c.plays.length, 0);

            Bozuko.models.Entry.findOne({contest_id: contest._id, user_id: user._id, tokens: 0}, function(err, e) {
                test.ok(!err);
                test.ok(e);
                test.done();
            });
        });
    });
};

exports['audit - missing prize and play'] = function(test) {

    var timestamp = new Date();

    Bozuko.models.Contest.findOne({_id: contest._id}, function(err, c) {
        test.ok(!err);

        var plays = free_play ? 5 : 4;

        // Add a fake prize onto the end of the results so we can force a win
        var results = c.results;
        results[plays - 1] = {
            index: 0,
            prize: '4dcc0c766982a2fb72000005',
            code: "ABCDEF",
            count: 1
        };

        var _uuid = uuid();

        // Add a fake active_play to the user's record for the contest.
        return Bozuko.models.Contest.findAndModify(
            {_id: contest._id},
            [],
            {$inc: {play_cursor: 1},
             $push: {plays: {timestamp: timestamp, active: true, uuid: _uuid, user_id: user._id, cursor: plays-1}},
             $set: {results: results}},
            {new: true},
          function(err, c) {
            test.ok(!err);
            test.equal(c.plays.length, 1);
            Bozuko.models.Contest.audit(function(err) {
                test.ok(!err);
                Bozuko.models.Contest.findOne({_id: contest._id}, function(err, c) {
                    test.ok(!err);
                    test.equal(c.plays.length, 0);
                    Bozuko.models.Prize.findOne(
                        {contest_id: contest._id, uuid: _uuid},
                        function(err, prize) {
                            test.ok(!err);
                            test.ok(prize != null);
                            test.equal(prize.timestamp.getTime(), timestamp.getTime());
                            Bozuko.models.Play.findOne(
                                {contest_id: contest._id, uuid: _uuid},
                                function(err, play) {
                                    test.ok(!err);
                                    test.ok(play);
                                    test.equal(play.timestamp.getTime(), timestamp.getTime());
                                    test.done();
                                }
                            );
                        }
                    );
                });
            });
        });
    });
};

exports['audit - missing play'] = function(test) {

    var timestamp = new Date();

    var _uuid = uuid();

    Bozuko.models.Contest.findOne({_id: contest._id}, function(err, c) {
        test.ok(!err);

        // Add a fake active_play to the user's record for the contest.
        // The play_cursor is longer than the results array, but it doesn't matter for the test.
        c.plays.push({timestamp: timestamp, active: true, uuid: _uuid, user_id: user._id});
        c.play_cursor++;

        c.save(function(err) {
            test.ok(!err);
            test.equal(c.plays.length, 1);
            test.equal(c.plays[0].active, true);
            Bozuko.models.Contest.audit(function(err) {
                test.ok(!err);
                Bozuko.models.Contest.findOne({_id: contest._id}, function(err, c) {
                    test.ok(!err);
                    test.equal(c.plays.length, 0);
                    Bozuko.models.Play.findOne(
                        {contest_id: contest._id, uuid: _uuid},
                        function(err, play) {
                            test.ok(!err);
                            test.ok(play);
                            test.equal(play.timestamp.getTime(), timestamp.getTime());
                            test.done();
                        }
                    );
                });
            });
        });
    });
};

function cleanup(callback) {
    var e = emptyCollection;
    async.parallel([e('User'), e('Contest'), e('Page'), e('Checkin'), e('Play'), e('Prize')], callback);
}

function emptyCollection(name) {
    return function(callback){
        Bozuko.models[name].remove(function(){callback(null, '');});
    };
};