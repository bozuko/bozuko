var testsuite = require('./config/testsuite');
var async = require('async');
var util = require('util');

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

function play(callback) {
    contest.play(user._id, function(err, result) {
        callback(err, result);
    });
}

exports['play  3 times'] = function(test) {
    async.parallel([play, play, play], function(err, results) {
        test.ok(!err);
        var res = results[0];
        test.deepEqual(res.play.game, 'slots');
        test.deepEqual(res.play.play_cursor+0, 0);
        test.deepEqual(results[1].play.play_cursor+0, 1);
        test.deepEqual(results[2].play.play_cursor+0, 2);
        test.done();
    });
};

exports['play fail - no tokens'] = function(test) {
    contest.play(user._id, function(err, result) {
        test.ok(err);
        Bozuko.models.Contest.findOne({_id: contest._id}, function(err, c) {
            test.ok(!err);
            test.deepEqual(c.play_cursor+0, 2);
            test.deepEqual(c.users[user._id].entries[0].tokens+0, 0);
            test.done();
        });
    });
};

// exports.cleanup = function(test) {
//     cleanup(test.done);
// };

function cleanup(callback) {
    var e = emptyCollection;
    async.parallel([e('User'), e('Contest'), e('Page'), e('Checkin'), e('Play'), e('Prize')], callback);
}

function emptyCollection(name) {
    return function(callback){
        Bozuko.models[name].remove(function(){callback(null, '');});
    };
};
