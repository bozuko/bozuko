var testsuite = require('./config/testsuite');
var async = require('async');
var BozukoError = Bozuko.require('core/error');

var start = new Date();
var end = new Date();
end.setTime(+start+(1000*60*60*24*2));

var page = new Bozuko.models.Page();
page.active = true;
page.name = "Test validation page";

var contest = new Bozuko.models.Contest(
{
    page_id: page._id,
    engine_type: 'order',
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
    win_frequency: 1.4,
    free_play_pct: 30
});

exports['save page'] = function(test) {
    page.save(function(err) {
        test.ok(!err);
        test.done();
    });
};

exports['prizes - no prizes'] = function(test) {
    contest.validatePrizes(false, function(err, status) {
        test.ok(status.errors[0] instanceof BozukoError);
        test.ok(status.errors[0].name === 'validate/contest/no_prizes');
        test.done();
    });
};

exports['prizes - valid prize'] = function(test) {
    contest.prizes.push({
        name: 'giftcard',
        value: '0',
        description: 'Gonna create some sick desynes fer you',
        details: 'Don\'t worry, you won\'t make money off this',
        instructions: 'Check yer email fool!',
        total: 1,
        won: 0,
        redeemed: 0,
        is_email: true,
        email_body: 'Something',
        email_codes: ["15h1ttyd3s1gn"]
    });

    var email_codes, email_body;
    contest.validatePrizes(false, function(err, status) {
        for (var i = 0; i < status.errors.length; i++) {
	    if (status.errors[i].name === 'validate/contest/email_codes') {
		email_codes = true;
	    }
	    if (status.errors[i].name === 'validate/contest/email_body') {
		email_body = true;
	    }
	}
        test.ok(!email_codes);
        test.ok(!email_body);
        test.done();
    });
};

exports['prizes - email codes count and missing body'] = function(test) {
    contest.prizes[0].total = 2;
    contest.prizes[0].email_body = '';

    var email_codes, email_body;

    contest.validatePrizes(false, function(err, status) {
        for (var i = 0; i < status.errors.length; i++) {
	    if (status.errors[i].name === 'validate/contest/email_codes') {
		email_codes = true;
	    }
	    if (status.errors[i].name === 'validate/contest/email_body') {
		email_body = true;
	    }
	}
        test.ok(email_codes);
        test.ok(email_body);
        test.done();
    });
};
exports['prizes - barcodes bad count'] = function(test) {
    contest.prizes.push({
        name: 'barcode prize',
        value: '0',
        description: 'a barcode',
        details: 'bc',
        instructions: 'get it scanned',
        total: 1,
        won: 0,
        redeemed: 0,
        is_barcode: true,
        barcodes: ["01234567", "12345678"]
    });

    contest.validatePrizes(false, function(err, status) {
	var bc_err = status.errors.some(function(err) {
	    if (err.name === 'validate/contest/barcodes_length') return true;
            return false;	    
	});
	test.ok(bc_err);
	test.done();
    });

};

exports['entries and plays - ok'] = function(test) {
    contest.publish(function(err) {
        contest.validateEntriesAndPlays(function(err, status) {
            test.ok(!status.errors.length);
            test.done();
        });
    });
};

exports['entries and plays - error'] = function(test) {
    var oldPlays = contest.total_plays;
    contest.total_plays = 3;
    contest.validateEntriesAndPlays(function(err, status) {
	test.equal(status.errors.length, 1);
	
	// Reset to real total_plays
	contest.total_plays = oldPlays;

	test.done();
    });
};

exports['prizes - barcodes exist on s3'] = function(test) {
    contest.prizes[1].total = 2;
    contest.publish(function(err) {
	test.ok(!err);
	contest.validatePrizes(false, function(err, status) {
	    var bc_err = status.errors.some(function(err) {
		if (err.name === 'validate/contest/barcodes_s3') return true;
		return false;
	    });
	    test.ok(!bc_err);
	    test.done();
	});
    });
};

exports['consolation prizes - none'] = function(test) {
    contest.validatePrizes(true, function(err, status) {
	test.ok(!status.errors.length);
	test.done();
    });
};

exports['results - no errors'] = function(test) {
    contest.validateResults(function(err, status) {
	test.ok(!status.errors.length);
	console.log("status.errors = "+status.errors);
	test.done();
    });
};

exports['results - bad free play count and prize count'] = function(test) {
    var prize_count_err_ct = 0;
    var free_play_err = false;

    // Reset results to junk
    var oldResults = contest.results;
    contest.results = {};

    contest.validateResults(function(err, status) {
	for (var i = 0; i < status.errors.length; i++) {
	    if (status.errors[i].name === 'validate/contest/results_prize_count') {
		prize_count_err_ct++;
	    }
	    if (status.errors[i].name === 'validate/contest/results_free_play_count') {
		free_play_err = true;
	    }
	}

	test.equal(prize_count_err_ct, 2);
	test.ok(free_play_err);
				
	// Reset to real contest results
	test.done();
    });
};

exports['validate_'] = function(test) {
    contest.validate_(function(err, status) {
	test.ok(status.entries_and_plays);
	test.ok(status.prizes);
	test.ok(status.consolation_prizes);
	test.ok(status.results);
	console.log(require('util').inspect(status));
	test.done();
    });
};