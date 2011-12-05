var rand = require('../util/math').rand;
var codify = require('codify');

/**
 * Contest Engine
 */
var Engine = module.exports = function( contest ){
    this.contest = contest;
    // Store all generated prize codes for this contest so we don't have dupes.
    this.codes = [];
};

Engine.prototype.default_primer_end = 0.10;

/**
 * Generate the result array for the contest
 */
Engine.prototype.generateResults = function(Page, page_id, callback){
    // Implement the logic to create a results array.
    return callback(new Error('Implement ME!!!'));
};

/**
 * Get the result of a play
 */
Engine.prototype.play = function(contest){};

var block_size = 10000000;

/**
 * Generate unique codes for each prize
 */
Engine.prototype.getCode = function(block) {
    block = block+1;
    var codes = this.codes;
    var start = block*block_size;
    var end = (block+1)*block_size - 1;
    var val = rand(start, end);

    while (codes[val]) {
        val = rand(start, end);
    }
    codes[val] = true;
    return codify.toCode(val);
};
