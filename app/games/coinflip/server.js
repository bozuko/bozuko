var rand = Bozuko.require('util/math').rand;

exports.run = function(config){
    // get the odds
    var result = rand(0,1);
    return {results: result};
};