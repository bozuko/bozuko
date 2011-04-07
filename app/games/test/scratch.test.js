var testsuite = require('./config/testsuite');

// Mock contest
var contest = {
    game_config: {}
};

var Scratch = require('../scratch/index.js');
var scratch = new Scratch(contest);

var size = 6;
var max_matches = 3;

// Ensure that no more than max_matches - 1 matches occur
exports['lose'] = function(test) {
    var used_nums = {};
    var val;
    var nums = scratch.process(false).numbers;
    var lost = true;

    for (var i = 0; i < size; i++) {
        val = nums[i];
        if (!used_nums[val]) {
            used_nums[val] = 1;
        } else {
            used_nums[val]++;
            if (used_nums[val] === max_matches) {
                lost = false;
                break;
            }
        }
    }
    test.ok(lost);
    test.done();
};

exports['win'] = function(test) {
    var used_nums = {};
    var val;
    var nums = scratch.process(1).numbers;

    for (var i = 0; i < size; i++) {
        val = nums[i];
        if (!used_nums[val]) {
            used_nums[val] = 1;
        } else {
            used_nums[val]++;
        }
    }

    var winners = 0;
    var too_many = false;

    for (x in used_nums) {
        if (used_nums[x] === max_matches) {
            winners++;
        } else if (used_nums[x] > max_matches) {
            too_many = true;
        }
    }

    test.equal(winners, 1);
    test.ok(!too_many);
    test.done();
};