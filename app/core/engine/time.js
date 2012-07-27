var Engine = require('../engine'),
    rand = Bozuko.require('util/math').rand,
    inherits = require('util').inherits,
    inspect = require('util').inspect,
    async = require('async'),
    merge = require('flatmerge');
;
var safe = {j:true};

var defaults = {
    buffer: 0.001,
    lookback_threshold: 0.1,
    window_divisor: 0.1,
    throwahead_multiplier: 10,
    multiplay: true
};

var TimeEngine = module.exports = function(contest, opts) {
    var options = opts || {};
    Engine.call(this, contest);
    this.configure(options);
};

inherits(TimeEngine, Engine);

var lookback_window_floor = 1000*60*3;

TimeEngine.prototype.setOpts = function(opts) {
    var self = this;
    if (!opts) {
        opts = defaults;
    } else {
        opts = merge(opts, defaults);
    }
    Object.keys(opts).forEach(function(key) {
        self[key] = opts[key];
    });
};

TimeEngine.prototype.configure = function(opts) {
    this.setOpts(opts);

    var totalContestLength = this.contest.end.getTime() - this.contest.start.getTime();

    // Leave a buffer at the end so users can always win the last prizes.
    this.contest_duration = Math.floor(totalContestLength*(1-this.buffer));

    this.buffer_start = new Date(this.contest.start.getTime() + this.contest_duration);
    
    this.lookback_threshold_start = new Date(
        this.contest.end.getTime() - Math.floor(totalContestLength*this.lookback_threshold)
    );

    this.step =  Math.floor(this.contest_duration/this.contest.totalPrizes());

    this.lookback_window = Math.round(this.step/this.window_divisor);
    if (this.lookback_window < lookback_window_floor) {
        this.lookback_window = lookback_window_floor;
    }

    this.throwahead_window = Math.round(this.step*this.throwahead_multiplier);

    if (this.contest.free_play_pct) {
        this.free_play_odds = Math.round(1/(this.contest.free_play_pct/100));
    }

    console.log('opts = ', opts);
    console.log("throwahead window = "+this.throwahead_window);
    console.log("lookback_window = "+this.lookback_window);
    console.log("lookback_threshold_start = "+this.lookback_threshold_start);
    console.log("buffer_start = "+this.buffer_start);
    console.log("multiplay = "+this.multiplay);
};

TimeEngine.prototype.play = function(memo, callback) {
    var now = memo.timestamp.getTime();
    memo.max_lookback = new Date(now - this.lookback_window);

    if (this.isFreePlay()) {
        memo.result = 'free_play';
        return callback(null, memo);
    }

    if (this.multiplay) {
        if (failEarly(memo.entry.tokens)) return callback(null, memo);
    }

    memo.query = this.getPlayQuery(memo);

    this.incrementPlayCursorForAnalytics();

    this.getResult(memo, callback);
};

TimeEngine.prototype.getResult = function(memo, callback) {
    var self = this;
    return Bozuko.models.Result.findAndModify(
        memo.query,
        [['timestamp', 'asc']],
        {$set: {win_time: memo.timestamp, user_id: memo.user._id, entry_id: memo.entry._id}},
        {new: true, safe: safe},
        function(err, result) {
            if (err) return callback(err);
            memo.result = result;
            if (memo.result) return callback(null, memo);

            self.redistribute(memo, callback);
        }
    );
};

TimeEngine.prototype.redistribute = function(memo, callback) {
    var self = this;
    var start = memo.timestamp.getTime();
    var end = start + this.throwahead_window;
    var new_time = new Date(rand(start, end));

    // Don't redistribute into the buffer
    if (new_time.getTime() > this.buffer_start.getTime()) return callback(null, memo);

    memo.new_time = new_time;

    this.redistributeResult(memo, callback);
};

TimeEngine.prototype.redistributeResult = function(memo, callback) {
    var self = this;
    return Bozuko.models.Result.findAndModify(
        {contest_id: this.contest._id, win_time: {$exists: false}, timestamp: {$lt: memo.max_lookback}},
        [['timestamp', 'asc']],
        {$push: {history: {timestamp: memo.new_time, move_time: memo.timestamp}}, $set: {timestamp: memo.new_time}},
        {new: false, safe: safe},
            function(err, result) {
            if (err) return callback(err);
            if (result) {
                console.log("contest: "+self.contest._id+" timestamp redistributed from "+
                    result.timestamp+" to "+memo.new_time+" at "+memo.timestamp);

                self.incrementRedistributionsForAnalytics();
            }
            return callback(null, memo);
        }
    );
};

TimeEngine.prototype.incrementRedistributionsForAnalytics = function(contest) {
    var self = this;
    Bozuko.models.Contest.update(
        {_id: self.contest._id},
        {$inc: {redistributions: 1}},
        function(err) {
            if (err) console.error('Redistribution analytics error: '+err);
            else Bozuko.publish('contest/redistribute', {
                contest_id: self.contest._id,
                contest_name: self.contest.name,
                restributions: self.contest.redistributions
            });
        }
    );
};

TimeEngine.prototype.generateResults = function(Page, page_id, callback) {
    var self = this;
    var contest = this.contest;
    var prizes = contest.prizes;
    var start = contest.start.getTime();
    var end = start+this.contest_duration;

    return Page.getCodeInfo(page_id, function(err, block, prefix) {
        var prize_index = -1;
        return async.forEachSeries(prizes, function(prize, cb) {
            prize_index++;
            if (!prize.distribution || prize.distribution === 'random') {
                self.distributeRandom(contest._id, prize.total, prize_index, start, end, prefix, block, cb);
            } else {
                self.distributeInterval(contest._id, prize.total, prize_index, start, end, prefix, block, cb);
            }
        }, callback);
    });
};

TimeEngine.prototype.distributeRandom = 
function(contest_id, totalPrizes, prize_index, start, end, prefix, block, callback) {
    var i = 0;
    var self = this;
    async.whilst(
        function() {
            return i < totalPrizes;
        },
        function(cb) {
            var date = new Date(rand(start, end));
            var result = {
                contest_id: contest_id,
                index: prize_index,
                code: prefix + self.getCode(block),
                count: i,
                timestamp: date,
                history: [{timestamp: date}]
            };
            i++;
            result = new Bozuko.models.Result(result);
            result.save(cb);
        },
        callback
    );
};

TimeEngine.prototype.distributeInterval 
= function(contest_id, totalPrizes, prize_index, start, end, prefix, block, callback) {
    var self = this;
    var interval = Math.floor((end-start)/totalPrizes);
    var segmentStart = start;
    var segmentEnd = start+interval;
    var i = 0;
    async.whilst(
        function() {
            return i < totalPrizes;
        },
        function(cb) {
            var date = new Date(rand(segmentStart, segmentEnd));
            var result = {
                contest_id: contest_id,
                index: prize_index,
                code: prefix + self.getCode(block),
                count: i,
                timestamp: date,
                history: [{timestamp: date}]
            };
            i++;
            segmentStart = segmentEnd+1;
            segmentEnd = segmentEnd+interval;
            result = new Bozuko.models.Result(result);
            result.save(function(error){
                result = null;
                if( error ) return cb(error);
                return cb();
            });
        }, 
        callback
    );
}

/**
 * This always returns true because there is no fixed number of plays
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
        {new: true, fields: {_id:1}, safe: safe},
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

TimeEngine.prototype.isFreePlay = function() {
    if (this.free_play_odds) {
        var winning_number = 1;
        if (rand(1, this.free_play_odds) === winning_number) {
            return true;
        }
    }
    return false;
}

// If we are into the buffer region, then allow wins on any previous prize.
// In other words, disregard the lookback window. We do this so that all prizes
// get handed out before the contest expires.
//
TimeEngine.prototype.getPlayQuery = function(memo) {
    var now = memo.timestamp.getTime();
    if (now > this.lookback_threshold_start.getTime()) {
        return { 
            contest_id: this.contest._id,
            timestamp: {$lte: memo.timestamp},
            win_time: {$exists: false}
        };
    } else {
        return {
            contest_id: this.contest._id,
            $and: [{timestamp: {$gt: memo.max_lookback}}, {timestamp: {$lte: memo.timestamp}}],
            win_time: {$exists: false}
        };
    }
};

TimeEngine.prototype.incrementPlayCursorForAnalytics = function() {
    Bozuko.models.Contest.findAndModify(
        {_id: this.contest._id},
        [],
        {$inc : {play_cursor: 1}},
        {new: true, fields: {_id: 1}},
        function(err, contest) {
            // this is just for analytics
        }
    );
};

