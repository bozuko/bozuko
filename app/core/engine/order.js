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

OrderEngine.prototype.generateResults = function(callback){
    var self = this;
    var options = this.contest.engine_options || {};

    var contest = this.contest;
    var results = {};

    var prizes = contest.prizes;

    var entryConfig = contest.getEntryConfig();
    var entryMethod = Bozuko.entry({type: entryConfig.type, contest: contest});
    entryMethod.configure( entryConfig );
    var max = entryMethod.getMaxTokens();

    var totalPlays = max*contest.total_entries;
    var freePlays = Math.floor(contest.free_play_pct/100*totalPlays) || 0;
    totalPlays = totalPlays + freePlays;

    var ar = [],
        primer = [],
        remainder = [];

    // By default set the primer_end to 10%. Single prizes will go out after primer_end even if
    // contest.engine_options.primer is not set.
    var primer_end = Math.floor(this.default_primer_end*totalPlays);

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
                code: self.getCode(),
                count: 0
            };
            results[index] = result;
        } else if (!options.primer && prize.total === 1) {
            index = pick_index(ar, primer_end);
            var result = {
                index: prize_index,
                prize: prize._id,
                code: self.getCode(),
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
                    code: self.getCode(),
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

    // Remove index arrays
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
};

OrderEngine.prototype.play = function(memo, callback) {
    var self = this;
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
//    console.log("this.contest = "+inspect(this.contest));
    return this.contest.incrementTokenCursor(tokens, callback);
};
