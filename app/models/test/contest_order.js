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

var ll = [42.646, -71.303];

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
    contest.page_id = page._id;
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

exports['enter contest'] = function(test) {
    Bozuko.enter(entry_opts, function(err, game_states) {
        console.log("err = "+err);
        test.ok(!err);
        test.done();
    });
};

exports['enter contest fail - no tokens'] = function(test) {
    Bozuko.enter(entry_opts, function(err) {
        test.ok(err);
        test.done();
    });
};

var free_play = false;

function play(callback) {
    var opts = {
        user: user,
        page_id: page._id,
        timestamp: new Date()
    };
    contest.play(opts, function(err, result) {
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
    var opts = {
        user: user,
        page_id: page._id,
        timestamp: new Date()
    };
    contest.play(opts, function(err, result) {
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

function cleanup(callback) {
    var e = emptyCollection;
    async.parallel([e('User'), e('Contest'), e('Page'), e('Checkin'), e('Play'), e('Prize')], callback);
}

function emptyCollection(name) {
    return function(callback){
        Bozuko.models[name].remove(function(){callback(null, '');});
    };
};