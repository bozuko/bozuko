var Engine = Bozuko.require('core/contest/engine'),
    rand = Bozuko.require('util/math').rand,
    inherits = require('util').inherits,
    inspect = require('util').inspect,
    mongoose = require('mongoose'),
    async = require('async')
;
var safe = {w:2, wtimeout: 5000};

var TimeEngine = module.exports = function(contest) {
    Engine.call(this, contest);
    this.configure();
};

inherits(TimeEngine, Engine);

TimeEngine.prototype.configure = function() {
    this.end_margin_multiplier = 0.10;

    /*
     * lookback_window = throwahead_window = (duration/totalPrizes)/window_divisor
     */

    // This number should work itself out to some constant
    this.window_divisor = 10;

    // Leave a buffer at the end so users can always win the last prizes.
    this.contest_duration = Math.floor(
        (this.contest.end.getTime() - this.contest.start.getTime())*(1-this.end_margin_multiplier));
    this.step =  Math.floor(
        (this.contest_duration)/this.contest.totalPrizes());
    this.lookback_window = this.step;
    this.throwahead_window = this.step;
};


/**
 * Generate contest results. Store in this.contest.results_array
 * 
 * @public
 */
TimeEngine.prototype.generateResults = function(callback) {
    var self = this;
    var options = this.contest.engine_options || {};        
    var contest = this.contest;
    var results = [];
    var prizes = contest.prizes;
    var start = contest.start.getTime();
    var end = start+this.contest_duration;

    prizes.forEach(function(prize, prize_index) {
        for (var i = 0; i < prize.total; i++) {
            var date = new Date(rand(start, end));
            var result = new Bozuko.models.Result({
                contest_id: contest._id,
                index: prize_index,
                code: self.getCode(),
                count: i,
                timestamp: date,
                history: [{timestamp: date}]
            });
            results.push(result);
        }
    });

    async.forEach(results, function(result, cb) {
        result.save(cb);
    }, function(err) {
        if (err) return callback(Bozuko.error('contest/generateResults'));
        return callback(null, results);
    });
};

TimeEngine.prototype.averageStep = function(contest_id, callback) {
    var self = this;
    Bozuko.models.Result.find(
        {contest_id: contest_id, win_time: {$exists: false}}, 
        {timestamp: 1, _id: 0},
        {sort: {timestamp: 1}}, 
        function(err, results) {
            if (err) return callback(err);
            var total = 0;
            for (var i = 1; i < results.length; i++) {
                var start = results[i-1].timestamp.getTime();
                var end = results[i].timestamp.getTime();
                total += (end-start);
            }
            
            var avg_step = self.avg_step = Math.floor(total/(results.length-1));
            return callback(null, {avg_step: avg_step, results: results});
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
    return callback(null);
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

    return Bozuko.models.Result.findAndModify({contest_id:self.contest._id, $and: 
        [{timestamp: {$gt: max_lookback}}, {timestamp: {$lte: memo.timestamp}}],
            win_time: {$exists: false}},
        [['timestamp', 'asc']],
        {$set: {win_time: memo.timestamp, user_id: memo.user._id, entry_id: memo.entry._id}},
        {new: true, safe: safe},
        function(err, result) {
            if (err) return callback(err);
            memo.result = result;
            if (memo.result) return callback(null, memo);
            return self.redistribute(memo, callback);
        }
    );
};


/**
 * Redistribute results if they were not won and are prior to the lookback window
 * 
 */
TimeEngine.prototype.redistribute = function(memo, callback) {
    var start = memo.timestamp.getTime();
    var end = start + this.throwahead_window;
    var new_time = new Date(rand(start, end));
    return Bozuko.models.Result.findAndModify(
        {contest_id: this.contest._id, win_time: {$exists: false}, timestamp: {$lt: memo.timestamp}},
        [['timestamp', 'asc']],
        {$push: {history: {timestamp: new_time, move_time: memo.timestamp}}, $set: {timestamp: new_time}},
        {new: false, safe: safe},
            function(err, result) {
            if (err) return callback(err);
            if (result) {
                console.log("timestamp redistributed from "+result.timestamp+" to "+new_time+
                    " at "+memo.timestamp);
            }
            return callback(null, memo);
        }
    );

};