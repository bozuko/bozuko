var Engine = Bozuko.require('core/contest/engine'),
    rand = Bozuko.require('util/math').rand,
    inherits = require('util').inherits;

var OrderEngine = module.exports = function(){
    Engine.apply(this, arguments);
};
inherits( OrderEngine, Engine );

OrderEngine.prototype.generateResults = function( ){

    var contest = this.contest;
    var results = {};

    var prizes = contest.prizes;
    // sort the prizes by value
//    prizes.sort( function(a, b){
    //    return b.value - a.value;
  //  });

    var max=0;
    contest.entry_config.forEach(function(entry_config){
        var entryMethod = Bozuko.entry(entry_config.type, contest);
        entryMethod.configure( entry_config );
       max = Math.max(parseInt(entryMethod.getMaxTokens()),max);
    });

    var totalPlays = max*contest.total_entries;
    var freePlays = Math.floor(contest.free_play_pct/100*totalPlays) || 0;
    totalPlays = totalPlays + freePlays;

    // not sure if this is the best way to do this, but it works
    var ar = [];
    for( var i=0; i<totalPlays; i++) ar.push(i);

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

    function pick_index() {
        var random = rand(0,ar.length-1);
        var index = ar[random];
        ar.splice( random, 1 );
        return index;
    }

    var index;
    prizes.forEach(function(prize, prize_index){
        for( var i = 0; i < prize.total; i++ ){
            index = pick_index();
            results[index] = {
                index: prize_index,
                prize: prize._id,
                code: get_code(),
                count: i
            };
        }
    });

    for (i = 0; i < freePlays; i++) {
        index = pick_index();
        results[index] = 'free_play';
    }

    delete ar;

    contest.results = results;
    contest.total_plays = totalPlays;
    contest.total_free_plays = freePlays;
};

OrderEngine.prototype.play = function( user_id, callback ){
    var tries = this.contest.total_plays - this.contest.play_cursor;
    this.startPlay(user_id, tries, callback);
};
