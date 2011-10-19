var rand = Bozuko.require('util/math').rand;

/**
 * Contest Engine
 */
var Engine = module.exports = function( contest ){
    this.contest = contest;
    // Store all generated prize codes for this contest so we don't have dupes.
    this.codes = {'0': true};
};

Engine.prototype.default_primer_end = 0.10;

/**
 * Generate the result array for the contest
 */
Engine.prototype.generateResults = function(contest){
    // Implement the logic to create a results array.
};

/**
 * Get the result of a play
 */
Engine.prototype.play = function(contest){};


/**
 * Generate unique codes for each prize
 */
Engine.prototype.getCode = function() {
    var codes = this.codes;
    var code = '0';
    while (codes[code]) {
        code = String.fromCharCode(65, letter(), letter(), letter(), letter(), letter());
    }
    codes[code] = true;
    return code;
};


/**
 * Generate a random letter
 */
function letter() { return rand(0,25) + 65; }
