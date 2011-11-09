var testsuite = require('./config/testsuite');
var async = require('async');
var inspect = require('util').inspect;

var user_loc = [-71.1061111, 42.375];

exports['cleanup old pages'] = function(test) {
    Bozuko.models.Page.remove(function(err) {
        test.ok(!err);
        test.done();
    });
};

var page1 = new Bozuko.models.Page({name: 'page1', active: true});
var page2 = new Bozuko.models.Page({name: 'page2', active: true});

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
        type: 'facebook/like',
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

// exports['ensure loadPagesContests returns the same contest for page1 and page2'] = function(test) {
//     Bozuko.models.Page.loadPagesContests([page1, page2], user, function(err, pages) {
//         console.log(inspect(pages));
//         test.ok(!err);
//         pages.forEach(function(page) {
//             test.eql(page.contests[0]._id, contest._id);
//         });
//         test.done();
//     });
// };
