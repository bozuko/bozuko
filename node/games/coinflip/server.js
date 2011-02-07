exports.run = function(config){
    // get the odds
    var result = Bozuko.require('util/math').rand(0,1);
    return {results: result};
};