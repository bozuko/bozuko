var Engine = Bozuko.require('core/contest/engine'),
    rand = Bozuko.require('util/math').rand,
    inherits = require('util').inherits,
    inspect = require('util').inspect,
    mongoose = require('mongoose'),
    async = require('async')
;
var safe = {w:2, wtimeout: 5000};

var TimeEngine = module.exports = function() {
    Engine.apply(this, arguments);
};

inherits(TimeEngine, Engine);

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
    var end = contest.end.getTime();
    var total_prizes = 0;
    for (var i = 0; i < prizes.length; i++) {
        total_prizes += prizes[i].total;
    }

    prizes.forEach(function(prize, prize_index) {
        for (var i = 0; i < prize.total; i++) {
           var result = new Bozuko.models.Result({
                contest_id: contest._id,
                index: prize_index,
                code: self.getCode(),
                count: i,
                timestamp: new Date(rand(start, end)),
                history: []
            });
            results.push(result);
        }
    });

    async.forEach(results, function(result, cb) {
        result.save(cb);
    }, function(err) {
        if (err) return callback(Bozuko.error('contest/generateResults'));
        return callback(null);
    });
};

// Key Variables. Can be modified at runtime to adapt to actual usage patterns. We should be able to 
// tweak the numbers based on past plays so that we can smooth out the odds over time.
TimeEngine.prototype.lookback_divisor = 10;
TimeEngine.prototype.lookforward_multiple = .5;

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
    var lookback_window = new Date(this.contest.end.getTime() - this.contest.start.getTime());
    var now = memo.timestamp.getTime();
    var max_lookback = new Date(now - lookback_window);

    return this.contest.spendEntryToken(memo, function(err, memo) {
        if (err) return callback(err);
        return Bozuko.models.Result.findAndModify({contest_id:self.contest._id, $and: 
            [{timestamp: {$gt: max_lookback}}, {timestamp: {$lte: new Date(now)}}],
            win_time: {$exists: false}},
            [],
            {$set: {win_time: memo.timestamp, user_id: memo.user._id, entry_id: memo.entry._id}},
            {new: true, safe: safe},
            function(err, result) {
                if (err) return callback(err);
                console.log("result = "+inspect(result));
                memo.result = result;            
                return callback(null, memo);
            }
        );
    }); 
};
