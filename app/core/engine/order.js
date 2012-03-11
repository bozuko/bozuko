var Engine = require('../engine'),
    rand = Bozuko.require('util/math').rand,
    inherits = require('util').inherits,
    async = require('async'),
    inspect = require('util').inspect;
;

var safe = {w:2, wtimeout:5000};

var OrderEngine = module.exports = function(){
    Engine.apply(this, arguments);
};
inherits( OrderEngine, Engine );

OrderEngine.prototype.generateResults = function(Page, page_id, callback) {
    var self = this;
    return Page.getCodeInfo(page_id, function(err, block, prefix) {
        if (err) return callback(err);
        var options = self.contest.engine_options || {},
            contest = self.contest,
            results = {},
            prizes = contest.prizes,
            entryConfig = contest.getEntryConfig(),
            entryMethod = Bozuko.entry({type: entryConfig.type, contest: contest});

        entryMethod.configure( entryConfig );

        var max = entryMethod.getMaxTokens(),
            ar = [],
            primer = [],
            remainder = [],
            total_plays;
        
        // If win_frequency == 1, we want every player to win exactly one time
        // and will use failEarly() in plays, so we only hit the array once
        // for each player per entry.
        if (self.contest.win_frequency == 1) {
          totalPlays = contest.total_entries;
        } else {
          totalPlays = max*contest.total_entries;
        }
        var freePlays = Math.floor(contest.free_play_pct/100*totalPlays) || 0,
        totalPlays = totalPlays + freePlays;

        // By default set the primer_end to 10%. Single prizes will go out after primer_end even if
        // contest.engine_options.primer is not set.
        var primer_end = Math.floor(self.default_primer_end*totalPlays);

        // Build Arrays that contain the indexes for results (ar, primer, remainder)
        if (options.primer) {
            primer_end = Math.floor(options.primer.region/100 * totalPlays);
            for (var j = 0; j < primer_end; j++) {
                primer.push(j);
            }
            for (j = primer_end; j < totalPlays; j++) {
                remainder.push(j);
            }
        } else {
            for( var i=0; i<totalPlays; i++) ar.push(i);
        }


        function pick_index(array, start) {
            var random = rand(start || 0,array.length-1);
            var index = array[random];
            array.splice( random, 1 );
            return index;
        }

        // Distribute prizes in the results object
        var index;
        prizes.forEach(function(prize, prize_index){

            if (options.primer) {
                var primer_prize_ct = Math.floor(options.primer.density/100 * prize.total);
            }

            if (options.primer && prize.total === 1) {
                index = pick_index(remainder);
                var result = {
                    index: prize_index,
                    prize: prize._id,
                    code: prefix+self.getCode(block),
                    count: 0
                };
                results[index] = result;
            } else if (!options.primer && prize.total === 1) {
                index = pick_index(ar, primer_end);
                var result = {
                    index: prize_index,
                    prize: prize._id,
                    code: prefix+self.getCode(block),
                    count: 0
                };
                results[index] = result;
            } else {
                for( var i = 0; i < prize.total; i++ ){
                    if (options.primer) {
                        if (i < primer_prize_ct) {
                            index = pick_index(primer);
                        } else {
                            index = pick_index(remainder);
                        }
                    } else {
                        index = pick_index(ar);
                    }
                    var result = {
                        index: prize_index,
                        prize: prize._id,
                        code: prefix+self.getCode(block),
                        count: i
                    };
                    results[index] = result;
                }
            }
        });

        // Use remaining indexes for free play distribution
        if (options.primer) ar = primer.concat(remainder);

        // Distribute free plays
        for (i = 0; i < freePlays; i++) {
            index = pick_index(ar);
            results[index] = 'free_play';
        }

        delete ar;
        delete primer;
        delete remainder;

        contest.results = results;
        contest.total_plays = totalPlays;
        contest.total_free_plays = freePlays;

        return contest.save(function(err) {
            if (err) console.error('Failed to save contest '+contest.id+' during publish: err = '+err);
            return callback(err, results);
        });
    });
};

/*
 * If the contest needs exactly one win per entry, we use this to determine losses.
 */
OrderEngine.prototype.failEarly = function(entry) {
    if (this.contest.win_frequency != 1) return false;
    if (entry.win) return true;
    if (entry.tokens == 0) return false;
    if (rand(0, entry.tokens+1) == 1) return false; 
    return true;
};

OrderEngine.prototype.play = function(memo, callback) {
    var self = this;

    console.log(memo.entry);
    if (this.failEarly(memo.entry)) return callback(null, memo);

    async.reduce(
        [this.contest.incrementPlayCursor, this.contest.getOrderResult],
        memo,
        function(memo, fn, cb) {
            return fn.call(self.contest, memo, cb);
        }, function(error, result) {
            return callback(error, result);
        }
    );
};

/**
 * Test to make sure there are enough tokens left in the contest to distribute
 *
 * @returns {Boolean} If there is enough tokens
 */
OrderEngine.prototype.allowEntry = function(entry){
    return this.contest.token_cursor + entry.getTokenCount() <= this.contest.total_plays - this.contest.total_free_plays;
};

/**
 * Perform any special processing required by this engine to enter the contest
 *
 */
OrderEngine.prototype.enter = function(tokens, callback) {
    return this.contest.incrementTokenCursor(tokens, callback);
};
