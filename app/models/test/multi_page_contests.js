var testsuite = require('./config/testsuite');
var async = require('async');
var inspect = require('util').inspect;

var user_loc = [42.375, -71.1061111];

var page1 = new Bozuko.models.Page({
    name: 'page1',
    active: true,
    is_location: true,
    coords: user_loc
});
var page2 = new Bozuko.models.Page({
    name: 'page2',
    active: true,
    is_location: true,
    coords: user_loc
});

var user = new Bozuko.models.User(
{
    name: 'Charlie Sheen',
    first_name: 'Charlie',
    last_name: 'Sheen',
    email: 'bozukob@gmail.com',
    token: 'dfasaa33345353453543',
    gender: 'male'
});

var start = new Date();
var end = new Date(start.getTime() + 60*10000);
var contest = new Bozuko.models.Contest({
    engine_type: 'order',
    game: 'slots',
    game_config: {
        theme: 'default'
    },
    entry_config: [{
        type: 'bozuko/checkin',
        tokens: 1,
        duration: 1
    }],
    start: start,
    end: end,
    win_frequency: 1,
    free_play_pct: 0,
    prizes: [{
        name: 'tacos',
        value: '5',
        total: 100
    }]
});

exports['cleanup'] = function(test) {
    async.forEach([Bozuko.models.Page, Bozuko.models.Contest],
    function(model, cb) {
        model.remove(cb);
    }, function(err) {
        test.done();
    });
};

exports['save user'] = function(test) {
    user.save(function(err) {
        test.ok(!err);
        test.done();
    });
};

exports['save pages'] = function(test) {
    async.forEachSeries([page1, page2], function(page, cb) {
        page.save(cb);
    }, function(err) {
        test.ok(!err);
        test.done();
    });
};

exports['save contest with two page_ids'] = function(test) {
    contest.page_ids = [page1._id, page2._id];
    contest.save(function(err) {
        test.ok(!err);
        test.done();
    });
};

exports['publish contest'] = function(test) {
    contest.publish(function(err) {
        test.ok(!err);
        test.done();
    });
};

exports['ensure loadPagesContests returns the same contest for page1 and page2'] = function(test) {
    Bozuko.models.Page.loadPagesContests([page1, page2], user, function(err, pages) {
        test.ok(!err);
        pages.forEach(function(page) {
            test.equal(page.contests[0].id, contest.id);
            // Ensure game_state has correct page_id
            var game_state = page.contests[0].game_state;
            test.equal(game_state.page_id, page.id);
        });
        test.done();
    });
};

/*
 * simulate /game/:id/entry route (game_state.links.game_entry)
 */
exports['ensure contest entry succeeds for each page'] = function(test) {
    async.forEach([page1, page2], function(page, cb) {
        var options = {
            ll: user_loc,
            accuracy: 100,
            page_id: page._id
        };

        var entry_method = Bozuko.entry(contest.getEntryConfig().type, user, options);
        contest.enter(entry_method, function(error, entry) {
            test.ok(!error);
            test.equal(entry.page_id, page.id);
            Bozuko.models.Entry.findOne(
                {page_id: page._id, contest_id: contest._id, user_id: user._id},
                function(err, entry) {
                    test.ok(!err);
                    test.ok(entry);
                    cb();
                }
            );
        });

    }, function(err) {
        test.done();
    });
};

exports['play out tokens for both entries at the second place'] = function(test) {
    var opts = {
        user: user,
        page_id: page2._id,
        timestamp: new Date()
    };
    contest.play(opts, function(err, result) {
        test.ok(!err);
        contest.play(opts, function(err, result) {
            test.ok(!err);
            Bozuko.models.Play.count(
                {contest_id: contest._id, page_id: page2._id, user_id: user._id},
                function(err, ct) {
                    test.equal(ct, 2);
                    Bozuko.models.Prize.count(
                        {contest_id: contest._id, page_id: page2._id, user_id: user._id},
                        function(err, ct) {
                            test.equal(ct, 2);
                            test.done();
                        }
                    );
                }
            );
        });
    });
};
