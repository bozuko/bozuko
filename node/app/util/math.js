/**
 * Return a random number within a range. The min and max values are included
 * in the possible results.
 *
 * @param max {integer} Minimum Value
 * @param min {integer} Maximum Value
 *
 * @returns {integer} Value within the range (inclusive)
 * 
 */
exports.rand = function(min,max){
    return min + Math.floor(Math.random()* (max-min+1));
};
