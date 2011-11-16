process.env.NODE_ENV='test';
var bozuko = require('../../../bozuko');
var OrderEngine = require('../order');
var inspect = require('util').inspect;

// Mock Contest Model
var contest = {
    prizes: [{
        _id: '0001',
        total: 1000
    }],
    getEntryConfig: function() {
        return {
            type: 'facebook/like',
            duration: '3600000',
            tokens: 3
        };
    },
    free_play_pct: 20,
    win_frequency: 2,
    total_entries: 1000*2,
    save: function(callback) {
        callback(null);
    }
};

exports['generate_results: no primer - 1000 of same prize'] = function(test) {
    var engine = new OrderEngine(contest);
    engine.generateResults(function(err, results) {
        // engine.generateResults() modifies contest
        var tokens = contest.getEntryConfig().tokens;
        test.deepEqual(contest.total_free_plays, Math.floor(tokens*contest.total_entries*.20));
        test.deepEqual(contest.total_plays, contest.total_entries*tokens+contest.total_free_plays);

        var free_play_ct = 0,
            prize_ct = 0;
        Object.keys(contest.results).forEach(function(index) {
            if (contest.results[index] === 'free_play') {
                free_play_ct++;
            } else if (contest.results[index]) {
                prize_ct++;
            }
        });
        test.deepEqual(contest.total_free_plays, free_play_ct);
        test.deepEqual(1000, prize_ct);
        test.done();
    });
};

exports['generate_results: primer - 1000 of same prize'] = function(test) {
    var primer = {
        region: 25,
        density: 70
    };
    contest.engine_options = {primer: primer};
    var engine = new OrderEngine(contest);
    engine.generateResults(function(err, results) {
        var tokens = contest.getEntryConfig().tokens;
        test.deepEqual(contest.total_free_plays, Math.floor(tokens*contest.total_entries*.20));
        test.deepEqual(contest.total_plays, contest.total_entries*tokens+contest.total_free_plays);

        var primer_end = Math.floor(contest.total_plays*primer.region/100);
        var primer_prize_ct = 0;

        var free_play_ct = 0,
            prize_ct = 0;
        Object.keys(contest.results).forEach(function(index) {
            if (contest.results[index] === 'free_play') {
                free_play_ct++;
            } else if (contest.results[index]) {
                prize_ct++;
                if (parseInt(index) < primer_end) {
                    primer_prize_ct++;
                }
            }
        });
        console.log(inspect(contest.results));
        test.deepEqual(contest.total_free_plays, free_play_ct);
        test.deepEqual(1000, prize_ct);
        test.deepEqual(primer_prize_ct, Math.floor(primer.density/100*prize_ct));
        test.done();
    });
};

exports['generate results: primer - high value prize'] = function(test) {
    contest.prizes.push({_id: '0002', total: 1});
    var primer = {
        region: 25,
        density: 70
    };
    contest.engine_options = {primer: primer};
    var engine = new OrderEngine(contest);
    engine.generateResults(function(err, results) {
        var tokens = contest.getEntryConfig().tokens;
        test.deepEqual(contest.total_free_plays, Math.floor(tokens*contest.total_entries*.20));
        test.deepEqual(contest.total_plays, contest.total_entries*tokens+contest.total_free_plays);

        var primer_end = Math.floor(contest.total_plays*primer.region/100);
        var primer_prize_ct = 0;

        var free_play_ct = 0,
            prize_ct = 0,
            high_value_ct = 0,
            high_value_index = 0;
        Object.keys(contest.results).forEach(function(index) {
            if (contest.results[index] === 'free_play') {
                free_play_ct++;
            } else if (contest.results[index]) {
                prize_ct++;
                if (parseInt(index) < primer_end) {
                    test.notEqual(contest.results[index].prize, '0002');
                    primer_prize_ct++;
                } else {
                    if (contest.results[index].prize === '0002') {
                        high_value_ct++;
                        high_value_index = index;
                    }
                }
            }
        });
        test.deepEqual(contest.total_free_plays, free_play_ct);
        test.deepEqual(1001, prize_ct);
        test.deepEqual(primer_prize_ct, Math.floor(primer.density/100*(prize_ct-1)));

        // ensure exactly one high value prize occurs after primer_end
        test.equal(high_value_ct, 1);
        test.ok(high_value_index >= primer_end);
        console.log("PRIMER END = "+primer_end);
        console.log("HIGH VALUE INDEX = "+high_value_index);
        test.done();
    });
};

exports['generate results: no primer - high value prize'] = function(test) {
    contest.engine_options = null;
    var engine = new OrderEngine(contest);
    engine.generateResults(function(err, results) {
        var tokens = contest.getEntryConfig().tokens;
        test.deepEqual(contest.total_free_plays, Math.floor(tokens*contest.total_entries*.20));
        test.deepEqual(contest.total_plays, contest.total_entries*tokens+contest.total_free_plays);

        var primer_end = Math.floor(contest.total_plays*engine.default_primer_end);
        var high_value_index = 0;
        var high_value_ct = 0;
        Object.keys(contest.results).forEach(function(index) {
            if (contest.results[index] != 'free_play') {
                if (contest.results[index].prize === '0002') {
                    high_value_index = index;
                    high_value_ct++;
                }
            }
        });
        test.equal(high_value_ct, 1);
        test.ok(high_value_index >= primer_end);
        console.log("PRIMER END = "+primer_end);
        console.log("HIGH VALUE INDEX = "+high_value_index);
        test.done();
    });
};

