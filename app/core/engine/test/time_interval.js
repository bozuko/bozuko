process.env.NODE_ENV='test';
var bozuko = require('../../../bozuko');
var TimeEngine = require('../time');
var async = require('async');

// 100 minutes
var start = new Date();
var end = new Date(start.getTime()+60*1000*100);

var page = new Bozuko.models.Page();
page.active = true;
page.name = 'test';

var contest = new Bozuko.models.Contest({
    engine_type: 'time',
    game: 'slots',
    engine_options: {
        multiplay: false
    },
    game_config: {
        theme: 'default'
    },
    entry_config: [{
        type: "facebook/checkin",
        tokens: 1,
        duration: 0
    }],
    start: start,
    end: end,
    free_play_pct: 0,
    prizes: [{
        name: 'stuff',
        value: 1,
        total: 10, 
        distribution: 'interval' 
    }]
});

exports['cleanup db'] = function(test) {
    Bozuko.models.Page.remove(function(err) {
        test.ok(!err);
        Bozuko.models.Result.remove(function(err) {
            test.ok(!err);
            Bozuko.models.Contest.remove(function(err) {
                test.ok(!err);
                test.done();
            });
        });
    });
};

exports['save page and contest'] = function(test) {
    page.save(function(err) {
        test.ok(!err);
        contest.page_id = page._id;
        contest.save(function(err) {
            test.ok(!err);
            test.done();
        });
    });
};

// This is a 100 min contest with 10 prizes. Therefore each interval should be 10 minutes 
exports['results get distributed at min hour intervals'] = function(test) {
    var engine = new TimeEngine(contest);
    var start = contest.start.getTime();
    var end = contest.end.getTime();
    // This is approximate and doesn't include the buffer (which is very small);
    var interval = Math.floor((end-start)/10);
    engine.generateResults(Bozuko.models.Page,  page._id, function(err) {
        test.ok(!err);
        Bozuko.models.Result.find().sort('timestamp', 1).run(function(err, results) {
            test.ok(!err);
            test.equal(results.length, 10);
            for (var i = 0; i < 10; i++) {
                console.log(start + interval*i);
                console.log(results[i].timestamp.getTime());
                console.log(start + interval*(i+1));
                console.log('\n');
                // Is result within the right interval?
                test.ok(results[i].timestamp.getTime() >= start + interval*i); 
                test.ok(results[i].timestamp.getTime() <= start + interval*(i+1)); 
            }
            test.done();
        });
    });
};
