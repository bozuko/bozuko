process.env.NODE_ENV='test';
var bozuko = require('../../../bozuko');
var TimeEngine = require('../time');
var measure = require('measure');

var start = new Date();
var end = new Date();
end.setTime(start.getTime() + (30*24*60*60*1000)); // 30 days

var contest = new Bozuko.models.Contest({
    engine_type: 'time',
    game: 'slots',
    engine_options: {
        multiplay: false
    },
    start: start,
    end: end,
    free_play_pct: 0,
    prizes: [{
        name: 'stuff',
        value: 1,
        total: 1000
    }]
});

var page = new Bozuko.models.Page();
page.active = true;
page.name = "Test page";

exports.setup = function(test) {
    Bozuko.models.Contest.remove(function() {
        Bozuko.models.Result.remove(function() {
            page.save(function() {
                contest.page_id = page._id;
                contest.save(test.done);
            });
        });
    });
};

exports['publish a month long contest with 1000 prizes'] = function(test) {
    var engine = new TimeEngine(contest, {multiplay: false});
    var done = measure.measure('engine.generateResults');
    engine.generateResults(Bozuko.models.Page, contest.page_id, function(err, _results) {
        console.log(measure.stats());
        test.ok(!err);

        Bozuko.models.Result.count(function(err, count) {
            test.equal(count, 1000);
            test.done();
        });
    });
};
