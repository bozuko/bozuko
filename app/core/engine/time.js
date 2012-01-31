var Engine = require('../engine'),
    rand = Bozuko.require('util/math').rand,
    inherits = require('util').inherits,
    inspect = require('util').inspect,
    async = require('async')
;
var safe = {w:2, wtimeout: 5000};

var TimeEngine = module.exports = function(contest, opts) {
    var options = opts || {};
    Engine.call(this, contest);
    this.configure(options);
};

inherits(TimeEngine, Engine);

var lookback_window_floor = 1000*60*3;

TimeEngine.prototype.configure = function(opts) {
    console.log('TimeEngine.configure: opts = '+inspect(opts));
    opts = opts || {};
    this.buffer = opts.buffer || 0.001;
    this.lookback_threshold = opts.lookback_threshold || 0.1;
    this.window_divisor = opts.window_divisor || 3; 
    this.throwahead_multiplier = opts.throwahead_multiplier || 10;

    // We have lots of tests that are single entry/ multiple play, but always need to actually check
    // the results. This setting allows us to disable the multiplay feature for the tests.
    if (opts.multiplay === undefined) {
        this.multiplay = true;
    } else {
        this.multiplay = opts.multiplay;
    }

    // Leave a buffer at the end so users can always win the last prizes.
    this.contest_duration = Math.floor(
        (this.contest.end.getTime() - this.contest.start.getTime())*(1-this.buffer));

    this.buffer_start = new Date(this.contest.start.getTime() + this.contest_duration);
    this.lookback_threshold_start = new Date(this.contest.end.getTime() - 
        Math.floor((this.contest.end.getTime() - this.contest.start.getTime())*this.lookback_threshold));
    this.step =  Math.floor(
        (this.contest_duration)/this.contest.totalPrizes());
    this.lookback_window = Math.round(this.step/this.window_divisor);
    if (this.lookback_window < lookback_window_floor) {
        this.lookback_window = lookback_window_floor;
    }
    this.throwahead_window = Math.round(this.step*this.throwahead_multiplier);
    console.log("throwahead window = "+this.throwahead_window);
    console.log("lookback_window = "+this.lookback_window);
    console.log("lookback_threshold_start = "+this.lookback_threshold_start);
    console.log("buffer_start = "+this.buffer_start);
    console.log("multiplay = "+this.multiplay);
    if (this.contest.free_play_pct) {
        this.free_play_odds = Math.round(1/(this.contest.free_play_pct/100));
    }
};


/**
 * Generate contest results.
 *
 * @public
 */
TimeEngine.prototype.generateResults = function(Page, page_id, callback) {
    var self = this;
    var options = this.contest.engine_options || {};
    var contest = this.contest;
    var prizes = contest.prizes;
    var start = contest.start.getTime();
    var end = start+this.contest_duration;

    return Page.getCodeInfo(page_id, function(err, block, prefix) {
        var prize_index = 0;
        return async.forEachSeries(prizes, function(prize, cb) {
            var i = 0;
            async.whilst(
                function() {
                    return i < prize.total;
                },
                function(cb) {
                    var date = new Date(rand(start, end));
                    var result = {
                        contest_id: contest._id,
                        index: prize_index,
                        code: prefix + self.getCode(block),
                        count: i,
                        timestamp: date,
                        history: [{timestamp: date}]
                    };
                    i++;
                    contest.saveTimeResult(result, cb);
                },
                function(err) {
                    prize_index++;
                    return cb( err );
                }
            );
        }, function(err) {
            if (err) return callback(err);
            // save the contest
            return contest.save(callback);
        });
    });
};

/**
 * This always returns true because there is no fixed number of plays
 *
 * @returns true
 */
TimeEngine.prototype.allowEntry = function(){
    return true;
};


/**
 * Perform any special processing required by this engine to enter the contest
 *
 * Just return successfully, because there are no limits on entry related to #plays
 */
TimeEngine.prototype.enter = function(tokens, callback) {
    Bozuko.models.Contest.findAndModify(
        { _id: this.contest._id},
        [],
        {$inc : {'token_cursor': tokens}},
        {new: true, fields: {_id:1}, safe: {w:2, wtimeout:5000}},
        function(err, contest) {
            // this is just for analytics
        }
    );
    return callback(null);
};

/*
 * For multiplay scenarios determine whether or not to actually use the time algorithm.
 */
var failEarly =
TimeEngine.failEarly = function(tokens) {
    if (tokens === 0) return false;
    if (rand(0, tokens+1) === 1) return false; 
    return true;
};


/**
 * Play an entry token
 *
 * @public
 */
TimeEngine.prototype.play = function(memo, callback) {
    var self = this;
    var now = memo.timestamp.getTime();
    var max_lookback = new Date(now - this.lookback_window);
    memo.max_lookback = max_lookback;

    // check for a free play before actually checking for win/loss
    if (this.free_play_odds) {
        var winning_number = 1;
        if (rand(1, this.free_play_odds) === winning_number) {
            memo.result = 'free_play';
            return callback(null, memo);
        }
    }

    if (this.multiplay) {
        if (failEarly(memo.entry.tokens)) return callback(null, memo);
    }

    // If we are into the buffer region, then allow wins on any previous prize.
    // In other words, disregard the lookback window. We do this so that all prizes
    // get handed out before the contest expires.
    //
    if (now > this.lookback_threshold_start.getTime()) {
        memo.query = self.contest.noLookbackQuery(memo);
    } else {
        memo.query = self.contest.lookbackQuery(memo);
    }

    Bozuko.models.Contest.findAndModify(
        {_id: this.contest._id},
        [],
        {$inc : {play_cursor: 1}},
        {new: true, fields: {_id: 1}, safe: {w:2, wtimeout:5000}},
        function(err, contest) {
            // this is just for analytics
        }
    );

    self.contest.getTimeResult(memo, callback);
};


/**
 * Redistribute results if they were not won and are prior to the lookback window
 *
 */
TimeEngine.prototype.redistribute = function(old_time) {
    var self = this;
    var start = old_time.getTime();
    var end = start + this.throwahead_window;
    var new_time = new Date(rand(start, end));

    // Don't redistribute into the buffer
    if (new_time.getTime() > this.buffer_start.getTime()) return null;

    return new_time;
};

