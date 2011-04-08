var testsuite = require('./config/testsuite');

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
    total_entries: 1000,
    total_plays: 3000,
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

exports['generate results'] = function(test) {
    contest.generateResults(function(err) {
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


exports.cleanup = function(test) {
    Bozuko.models.User.remove(function(err) {
        test.ok(!err);
        Bozuko.models.Contest.remove(function(err) {
            test.ok(!err);
            Bozuko.models.Page.remove(function(err) {
                test.ok(!err);
                Bozuko.models.Checkin.remove(function(err) {
                    test.ok(!err);
                    test.done();
                });
            });
        });
    });
};
