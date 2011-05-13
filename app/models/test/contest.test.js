var testsuite = require('./config/testsuite');
var async = require('async');
var util = require('util');
var uuid = require('node-uuid');

var start = new Date();
var end = new Date();
end.setTime(start.getTime()+1000*60*60*24*2);

var user = new Bozuko.models.User(
{
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
    free_play_pct: 50,
    total_entries: 1
});
contest.prizes.push({
    name: 'Wicked cool T-Shirt',
    value: '20',
    description: "Awesome Owl Watch T-Shirt",
    details: "Only available in Large or Extra-large",
    instructions: "Show this screen to an employee",
    total: 1
});
contest.prizes.push({
    name: 'Owl Watch Mug',
    value: '10',
    description: "Sweet travel Mug",
    details: "Not good for drinking out of.",
    instructions: "Show this screen to an employee",
    total: 1
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

exports['enter contest fail - no tokens'] = function(test) {
  var entryMethod = Bozuko.entry('facebook/checkin', user, {checkin: checkin});
    contest.enter(entryMethod, function(err, e) {
        test.ok(err);
        test.done();
    });
};

var free_play = false;

function play(callback) {
    contest.play(user._id, function(err, result) {
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
            test.equal(c.plays[0].active, false);
            test.equal(c.plays[1].active, false);
            test.equal(c.plays[2].active, false);
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
            test.deepEqual(c.entries[0].tokens+0, 0);
            test.equal(c.plays[play_cursor].active, false);
            test.done();
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
            prize: '4dcc0c766982a2fb72000005'
        };

        // Add a fake active_play to the user's record for the contest.
        return Bozuko.models.Contest.findAndModify(
            {_id: contest._id},
            [],
            {$inc: {play_cursor: 1},
             $push: {plays: {timestamp: timestamp, active: true, uuid: uuid(), user_id: user._id}},
             $set: {results: results}},
            {new: true},
          function(err, c) {
            test.ok(!err);
            test.equal(c.plays.length, plays);
            test.equal(c.plays[plays-1].active, true);
            Bozuko.models.Contest.audit(function(err) {
                test.ok(!err);
                Bozuko.models.Contest.findOne({_id: contest._id}, function(err, c) {
                    test.ok(!err);
                    test.equal(c.plays.length, plays);
                    test.equal(c.plays[plays-1].active, false);
                    Bozuko.models.Prize.findOne(
                        {contest_id: contest._id, play_cursor: plays - 1},
                        function(err, prize) {
                            test.ok(!err);
                            console.log("prize = "+JSON.stringify(prize));
                            test.ok(prize != null);
                            test.equal(prize.timestamp.getTime(), timestamp.getTime());
                            test.equal(prize.uuid, c.plays[plays-1].uuid);
                            Bozuko.models.Play.findOne(
                                {contest_id: contest._id, play_cursor: plays - 1},
                                function(err, play) {
                                    test.ok(!err);
                                    test.ok(play);
                                    test.equal(play.timestamp.getTime(), timestamp.getTime());
                                    test.equal(play.uuid, c.plays[plays-1].uuid);
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
    var plays = free_play ? 6 : 5;

    Bozuko.models.Contest.findOne({_id: contest._id}, function(err, c) {
        test.ok(!err);

        // Add a fake active_play to the user's record for the contest.
        // The play_cursor is longer than the results array, but it doesn't matter for the test.
        c.plays.push({timestamp: timestamp, active: true, uuid: uuid(), user_id: user._id});
        c.play_cursor++;

        c.save(function(err) {
            test.ok(!err);
            test.equal(c.plays.length, plays);
            test.equal(c.plays[plays-1].active, true);
            Bozuko.models.Contest.audit(function(err) {
                test.ok(!err);
                Bozuko.models.Contest.findOne({_id: contest._id}, function(err, c) {
                    test.ok(!err);
                    test.equal(c.plays.length, plays);
                    test.equal(c.plays[plays-1].active, false);
                    Bozuko.models.Play.findOne(
                        {contest_id: contest._id, play_cursor: plays-1},
                        function(err, play) {
                            test.ok(!err);
                            test.ok(play);
                            test.equal(play.timestamp.getTime(), timestamp.getTime());
                            test.equal(play.uuid, c.plays[plays-1].uuid);
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
