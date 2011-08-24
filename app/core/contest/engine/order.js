var Engine = Bozuko.require('core/contest/engine'),
    rand = Bozuko.require('util/math').rand,
    inherits = require('util').inherits;

var OrderEngine = module.exports = function(){
    Engine.apply(this, arguments);
};
inherits( OrderEngine, Engine );

OrderEngine.prototype.default_primer_end = 0.10;

OrderEngine.prototype.generateResults = function(){

    options = this.contest.engine_options || {};        

    var contest = this.contest;
    var results = {};

    var prizes = contest.prizes;

    var entryConfig = contest.getEntryConfig();
    var entryMethod = Bozuko.entry(entryConfig.type, contest);
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

    // Store all generated prize codes for this contest so we don't have dupes.
    var codes = {'0' : true};

    function letter() { return rand(0,25) + 65; }
    function get_code() {
        var code = '0';
        while (codes[code]) {
            code = String.fromCharCode(65, letter(), letter(), letter(), letter(), letter());
        }
        codes[code] = true;
        return code;
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
            results[index] = {
                index: prize_index,
                prize: prize._id,
                code: get_code(),
                count: 0
            };         
        } else if (!options.primer && prize.total === 1) {
            index = pick_index(ar, primer_end);
            results[index] = {
                index: prize_index,
                prize: prize._id,
                code: get_code(),
                count: 0
            };
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
                results[index] = {
                    index: prize_index,
                    prize: prize._id,
                    code: get_code(),
                    count: i
                };
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
};

OrderEngine.prototype.play = function( user_id, callback ){
    var tries = this.contest.total_plays - this.contest.play_cursor;
    this.startPlay(user_id, tries, callback);
};
