var bozuko = require('bozuko');

exports.run = function(config){
    // get the odds
    var result = bozuko.require('util/math').rand(0,1);
    return {results: result};
};