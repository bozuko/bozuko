var rand = Bozuko.require('util/math').rand;

module.exports = {
    generateResults : function(contest){

        var results = {};

        var prizes = contest.prizes;
        // sort the prizes by value
        prizes.sort( function(a, b){
            return b.value - a.value;
        });

        var max=0;
        contest.entry_config.forEach(function(entry_config){
            max = Math.max(parseInt(entry_config.tokens),max);
        });

        var totalPlays = max*contest.total_entries;

        // not sure if this is the best way to do this, but it works
        var ar = [];
        for( var i=0; i<totalPlays; i++) ar.push(i);


        prizes.forEach(function(prize, prize_index){
            for( var i = 0; i < prize.total; i++ ){
                // get a random number
                var random = rand(0,ar.length-1);
                var index = ar[random];
                ar.splice( random,1 );
                results[index] = {
                    index: prize_index,
                    prize: prize._id
                };
            }
        });
        delete ar;

        contest.results = results;
        contest.total_plays = totalPlays;
    }
};