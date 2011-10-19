var testsuite = require('./config/testsuite');
var async = require('async');
var inspect = require('util').inspect;

var start = new Date().getTime();
var end = new Date();
//end.setTime(start+(1000*1000)); // 1000 sec
end.setTime(start+(3000));

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
    engine_type: 'time',
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
    free_play_pct: 0
    
});
contest.prizes.push({
    name: 'DBC $10 giftcard',
    value: '0',
    description: 'Gonna create some sick desynes fer you',
    details: 'Don\'t worry, you won\'t make money off this',
    instructions: 'Check yer email fool!',
    total: 100,
    won: 0,
    redeemed: 0,
    is_email: false
});

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

exports['publish contest'] = function(test) {
    contest.publish(function(err, results) {
        test.ok(!err);
        test.done();
    });
};

exports['enter contest'] = function(test) {
    var entryMethod = Bozuko.entry('facebook/checkin', user, {ll:ll});
    contest.enter(entryMethod, function(err, e) {
        test.ok(!err);
        if( err ) console.log(err.stack);
        entry = e;
        test.done();
    });
};

var engine = contest.getEngine();
var memo = {
    contest: this,
    user: user,
    timestamp: new Date()
};

exports['play - win'] = function(test) {
    contest.play(user, function(err, doc) {
                     console.log(err);
        test.ok(!err);
        test.ok(doc);
        test.done();
    });
};

function cleanup(callback) {
    var e = emptyCollection;
    async.parallel([e('User'), e('Contest'), e('Page'), e('Checkin'), e('Play'), e('Prize'), e('Result')], callback);
}

function emptyCollection(name) {
    return function(callback){
        Bozuko.models[name].remove(function(){callback(null, '');});
    };
};