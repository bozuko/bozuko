/**
 * Abstract Contest Engine
 */
var Engine = module.exports = function( contest ){
    this.contest = contest;
};

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