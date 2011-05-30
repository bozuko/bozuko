var testsuite = require('./config/testsuite');
var async = require('async');

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

var start = new Date();
var end = new Date();
end.setTime(start.getTime()+1000*60*60*24*2);

var contest_all_once = new Bozuko.models.Contest(
{
    game: 'slots',
    game_config: {
        icons: ['seven','bar','bozuko','banana','monkey','cherries']
    },
    entry_config: [{
        type: "facebook/checkin",
        tokens: 3
    }],
    consolation_config: [{
        who: 'all',
        when: 'once'
    }],
    start: start,
    end: end,
    free_play_pct: 0,
    total_entries: 2,
    prizes: [{
        name: 'Litter Critters',
        value: '0',
        description: 'Wash your hands after you play',
        details: 'Your cat gives so many wonderful presents',
        total: 3
    }],
    consolation_prizes: [{
        name: 'Log',
        value: '5',
        description: 'Log, Log everyone loves a Log!',
        details: 'A beautiful gift for all ages',
        instructions: 'Show this screen to an employee',
        total: 1000
    }]

});

var contest_all_always = new Bozuko.models.Contest(
{
    game: 'slots',
    game_config: {
        icons: ['seven','bar','bozuko','banana','monkey','cherries']
    },
    entry_config: [{
        type: "facebook/checkin",
        tokens: 3
    }],
    consolation_config: [{
        who: 'all',
        when: 'always'
    }],
    start: start,
    end: end,
    free_play_pct: 0,
    total_entries: 2,
    prizes: [{
        name: 'Litter Critters',
        value: '0',
        description: 'Wash your hands after you play',
        details: 'Your cat gives so many wonderful presents',
        total: 3
    }],
    consolation_prizes: [{
        name: 'Log',
        value: '5',
        description: 'Log, Log everyone loves a Log!',
        details: 'A beautiful gift for all ages',
        instructions: 'Show this screen to an employee',
        total: 1000
    }]
});

var contest_losers_always_one_win = new Bozuko.models.Contest(
{
    game: 'slots',
    game_config: {
        icons: ['seven','bar','bozuko','banana','monkey','cherries']
    },
    entry_config: [{
        type: "facebook/checkin",
        tokens: 3
    }],
    consolation_config: [{
        who: 'losers',
        when: 'always'
    }],
    start: start,
    end: end,
    free_play_pct: 0,
    total_entries: 1,
    prizes: [{
        name: 'Litter Critters',
        value: '0',
        description: 'Wash your hands after you play',
        details: 'Your cat gives so many wonderful presents',
        total: 1
    }],
    consolation_prizes: [{
        name: 'Log',
        value: '5',
        description: 'Log, Log everyone loves a Log!',
        details: 'A beautiful gift for all ages',
        instructions: 'Show this screen to an employee',
        total: 3
    }]
});

var contest_losers_once = new Bozuko.models.Contest(
{
    game: 'slots',
    game_config: {
        icons: ['seven','bar','bozuko','banana','monkey','cherries']
    },
    entry_config: [{
        type: "facebook/checkin",
        tokens: 3
    }],
    consolation_config: [{
        who: 'losers',
        when: 'once'
    }],
    start: start,
    end: end,
    free_play_pct: 0,
    total_entries: 10,
    consolation_prizes: [{
        name: 'Log',
        value: '5',
        description: 'Log, Log everyone loves a Log!',
        details: 'A beautiful gift for all ages',
        instructions: 'Show this screen to an employee',
        total: 1000
    }]
});

var contest_losers_always = new Bozuko.models.Contest(
{
    game: 'slots',
    game_config: {
        icons: ['seven','bar','bozuko','banana','monkey','cherries']
    },
    entry_config: [{
        type: "facebook/checkin",
        tokens: 3
    }],
    consolation_config: [{
        who: 'losers',
        when: 'always'
    }],
    start: start,
    end: end,
    free_play_pct: 0,
    total_entries: 10,
    consolation_prizes: [{
        name: 'Log',
        value: '5',
        description: 'Log, Log everyone loves a Log!',
        details: 'A beautiful gift for all ages',
        instructions: 'Show this screen to an employee',
        total: 1000
    }]
});


exports['cleanup'] = function(test) {
    cleanup(function(err) {
        test.ok(!err);
        test.done();
    });
};

exports['save user and page'] = function(test) {
    async.forEach([user, page, contest_all_once, contest_all_always, contest_losers_always,
        contest_losers_once],
        function(model, callback) {
            model.save(callback);
        },
        function(err) {
            test.ok(!err);
            test.done();
        }
    );
};

var contests = [contest_all_once, contest_all_always, contest_losers_once, contest_losers_always,
    contest_losers_always_one_win];

exports['save contests'] = function(test) {
    async.forEach(contests,
        function(contest, callback) {
            contest.page_id = page._id;
            contest.save(callback);
        },
        function(err) {
            test.ok(!err);
            test.done();
        }
    );
};

exports['generate contest results'] = function(test) {
    async.forEach(contests,
        function(contest, callback) {
            contest.generateResults(callback);
        },
        function(err) {
            test.ok(!err);
            test.done();
        }
    );
};

var old_user_checkin_duration = Bozuko.config.checkin.duration.user;
var old_page_checkin_duration = Bozuko.config.checkin.duration.page;

exports['enter contests'] = function(test) {
    Bozuko.config.checkin.duration.user = 0;
    Bozuko.config.checkin.duration.page = 0;
    var count = 0;
    async.forEach(contests,
        function(contest, callback) {
            var checkin = new Bozuko.models.Checkin();
            checkin.timestamp = new Date();
            checkin.user_id = user._id;
            checkin.page_id = page._id;
            var entryMethod = Bozuko.entry('facebook/checkin', user, {checkin: checkin});
            contest.enter(entryMethod, function(err, e) {
                callback(err);
            });
        },
        function(err) {
            if (err) console.log(err);
            test.ok(!err);
            test.done();
        }
    );
};

exports['everyone gets a consolation prize once per contest'] = function(test) {
    play3times(contest_all_once, function(err, result) {
        test.ok(!err);
        test.ok(result);
        // There should be a consolation prize here
        test.ok(result.play.consolation);

        var checkin = new Bozuko.models.Checkin();
        checkin.timestamp = new Date();
        checkin.user_id = user._id;
        checkin.page_id = page._id;
        var entryMethod = Bozuko.entry('facebook/checkin', user, {checkin: checkin});
        contest_all_once.enter(entryMethod, function(err, e) {
            test.ok(!err);
            play3times(contest_all_once, function(err, result) {
                if (err) console.log(err);
                test.ok(!err);

                // We can only get one consolation prize per contest
                test.ok(!result.play.consolation);

                // ensure there is only 1 consolation prize
                Bozuko.models.Prize.find(
                    {contest_id: contest_all_once._id, consolation: true},
                    function(err, prizes) {
                        test.ok(!err);
                        test.deepEqual(1, prizes.length);

                        // ensure there is only 1 consolation play
                        Bozuko.models.Play.find(
                            {contest_id: contest_all_once._id, consolation: true},
                            function(err, plays) {
                                test.ok(!err);
                                test.deepEqual(1, plays.length);
                                test.done();
                            }
                        );
                    }
                );
            });
        });

    });

};

exports['everyone gets a consolation prize every time they run out of plays'] = function(test) {
    play3times(contest_all_always, function(err, result) {
        test.ok(!err);
        test.ok(result);
        // There should be a consolation prize here
        test.ok(result.play.consolation);

        var checkin = new Bozuko.models.Checkin();
        checkin.timestamp = new Date();
        checkin.user_id = user._id;
        checkin.page_id = page._id;
        var entryMethod = Bozuko.entry('facebook/checkin', user, {checkin: checkin});
        contest_all_always.enter(entryMethod, function(err, e) {
            test.ok(!err);
            play3times(contest_all_always, function(err, result) {
                if (err) console.log(err);
                test.ok(!err);
                test.ok(result.play.consolation);

                // ensure there are 2 consolation prizes
                Bozuko.models.Prize.find(
                    {contest_id: contest_all_always._id, consolation: true},
                    function(err, prizes) {
                        test.ok(!err);
                        test.deepEqual(2, prizes.length);

                        // ensure there are 2 consolation plays
                        Bozuko.models.Play.find(
                            {contest_id: contest_all_always._id, consolation: true},
                            function(err, plays) {
                                test.ok(!err);
                                test.deepEqual(2, plays.length);
                                test.done();
                            }
                        );
                    }
                );
            });
        });

    });
};

exports['every loser gets a consolation prize once per contest'] = function(test) {

    play3times(contest_losers_once, function(err, result) {
        test.ok(!err);
        test.ok(result);
        // There should be a consolation prize here
        test.ok(result.play.consolation);

        var checkin = new Bozuko.models.Checkin();
        checkin.timestamp = new Date();
        checkin.user_id = user._id;
        checkin.page_id = page._id;
        var entryMethod = Bozuko.entry('facebook/checkin', user, {checkin: checkin});
        contest_losers_once.enter(entryMethod, function(err, e) {
            test.ok(!err);
            play3times(contest_losers_once, function(err, result) {
                if (err) console.log(err);
                test.ok(!err);
                test.ok(!result.play.consolation);

                // ensure there is only 1 consolation prize
                Bozuko.models.Prize.find(
                    {contest_id: contest_losers_once._id, consolation: true},
                    function(err, prizes) {
                        test.ok(!err);
                        test.deepEqual(1, prizes.length);

                        // ensure there is only 1 consolation play
                        Bozuko.models.Play.find(
                            {contest_id: contest_losers_once._id, consolation: true},
                            function(err, plays) {
                                test.ok(!err);
                                test.deepEqual(1, plays.length);
                                test.done();
                            }
                        );
                    }
                );
            });
        });

    });
};

exports['every loser gets a consolation prize every time they run out of plays'] = function(test) {
    play3times(contest_losers_always, function(err, result) {
        test.ok(!err);
        test.ok(result);
        // There should be a consolation prize here
        test.ok(result.play.consolation);

        var checkin = new Bozuko.models.Checkin();
        checkin.timestamp = new Date();
        checkin.user_id = user._id;
        checkin.page_id = page._id;
        var entryMethod = Bozuko.entry('facebook/checkin', user, {checkin: checkin});
        contest_losers_always.enter(entryMethod, function(err, e) {
            test.ok(!err);
            play3times(contest_losers_always, function(err, result) {
                if (err) console.log(err);
                test.ok(!err);
                test.ok(result.play.consolation);

                // ensure there are 2 consolation prizes
                Bozuko.models.Prize.find(
                    {contest_id: contest_losers_always._id, consolation: true},
                    function(err, prizes) {
                        test.ok(!err);
                        test.deepEqual(2, prizes.length);

                        // ensure there are 2 consolation plays
                        Bozuko.models.Play.find(
                            {contest_id: contest_losers_always._id, consolation: true},
                            function(err, plays) {
                                test.ok(!err);
                                test.deepEqual(2, plays.length);
                                test.done();
                            }
                        );
                    }
                );
            });
        });

    });
};

exports['ensure no consolation prize goes to a winner'] = function(test) {
    play3times(contest_losers_always_one_win, function(err, result) {
        if (err) console.log(err);
        test.ok(!err);
        test.ok(result.won);
        test.ok(!result.play.consolation);

        // ensure there are no consolation prizes
        Bozuko.models.Prize.find(
            {contest_id: contest_losers_always_one_win._id, consolation: true},
            function(err, prizes) {
                test.ok(!err);
                test.equal(prizes.length, 0);

                // ensure there are 3 plays that aren't consolation
                Bozuko.models.Play.find(
                    {contest_id: contest_losers_always_one_win._id, consolation: false},
                    function(err, plays) {
                        test.ok(!err);
                        test.equal(plays.length, 3);
                        test.done();
                    }
                );
            }
        );
    });
};

exports['teardown'] = function(test) {
    Bozuko.config.checkin.duration.user = old_user_checkin_duration;
    Bozuko.config.checkin.duration.page = old_page_checkin_duration;
    test.done();
};

function play3times(contest, callback) {
    var count = 0;
    var result;
    var won = false;
    var inspect = require('util').inspect;
    async.whilst(
        function() { return count < 3; },
        function(callback) {
            contest.play(user._id, function(err, res) {
                console.log('res.play.win = '+res.play.win);
                if (res.play.win) won = true;
                result = res;
                count++;
                callback(err, res);
            });
        },
        function(err) {
            result.won = won;
            callback(err, result);
        }
    );
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
