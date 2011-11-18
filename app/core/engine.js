var rand = require('../util/math').rand;

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
    return this.intToCode(val);
};


// This function accepts numbers from 0-35
function character(num) {
    if (num < 10) return String(num);
    return String.fromCharCode(num-10+65);
}

/*
 * Generate an alphanumeric (base-36) code from an integer
 */
Engine.prototype.intToCode = function(val) {
    var code = '';

    while (val >= 1) {
        var remainder = val % 36;
        val = Math.floor(val / 36);
        code = character(remainder)+code;
    }
    return code;
};

var digits = {};
for (var i = 0; i < 10; i++) {
    digits[String(i)] = i;
}
for (i = 0; i < 26; i++) {
    digits[String.fromCharCode(i+65)] = i+10;
}

/*
 * Convert an alphanumeric (base-36) code to an integer
 */
Engine.prototype.codeToInt = function(code) {
    var calculated = 0;
    for (var i =0; i < code.length; i++) {
        var num = digits[code.charAt(i)];
        calculated += Math.pow(36, code.length-i-1)*num;
    }
    return calculated;
};
