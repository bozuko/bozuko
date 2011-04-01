var assert = require('assert');

// Mock contest
var contest = {
    game_config: {}
};

var Scratch = require('../scratch/index.js');
var scratch = new Scratch(contest);

exports['lose'] = function() {
    var result = scratch.process(false);
    result.user_numbers.forEach(function(num) {
        for (var i = 0; i < result.winning_numbers.length; i++) {
            assert.ok(result.winning_numbers[i] != num);
        }
    });
};

exports['win'] = function() {
    var match_index = 2;
    var result = scratch.process(match_index);
    var num_matches = 0;
    result.user_numbers.forEach(function(num) {
        for (var i = 0; i < result.winning_numbers.length; i++) {
            if (match_index === i) {
                if (result.winning_numbers[match_index] === num) {
                    num_matches++;
                }
            } else {
                assert.ok(result.winning_numbers[i] != num);
            }
        }
    });
    assert.eql(num_matches, 1);
};