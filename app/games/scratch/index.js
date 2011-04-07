var Game = Bozuko.require('core/game');
var rand = Bozuko.require('util/math').rand;

var Scratch = module.exports = function() {
    Game.apply(this,arguments);
    this.config = this.config || {};
};

Scratch.prototype.__proto__ = Game.prototype;
var proto = Scratch.prototype;

proto.name = "Scratch";

var min = 0,
    max = 99;

var size = 6;
var num_matches = 3;

proto.process = function(outcome) {
    var numbers;
    if (outcome === false) {
        numbers = lose();
    } else {
        numbers = win();
    }

    return numbers;
};

function win() {
    var ar = [];
    for (var i = 0; i < size; i++) { ar[i] = i; }

    winning_number = rand(min, max);
    var results = [];

    // fill in winning positions
    for (i = 0; i < num_matches; i++) {
        var random = rand(0, ar.length-1);
        var index = ar[random];
        ar.splice(random, 1);
        results[index] = winning_number;
    }

    var done;
    var used_nums = {};
    var val;

    // fill in other positions
    for (i = 0;  i < ar.length; i++) {
        var index = ar[i];
        done = false;
        while (!done) {
            val = rand(min, max);
            if (val != winning_number) {
                if (!used_nums[val]) {
                    results[index] = val;
                    used_nums[val] = 1;
                    done = true;
                } else if (used_nums[val] < num_matches-1) {
                    results[index] = val;
                    used_nums[val]++;
                    done = true;
                }
            }
        }
    }

    return {
        winning_number: winning_number,
        numbers: results
    };
}

function lose() {
    var results = [];
    var used_nums = {};
    var done = false;
    var val;

    for (var i = 0; i < size; i++) {
        done = false;
        while (!done) {
            val = rand(min, max);
            if (!used_nums[val]) {
                results[i] = val;
                used_nums[val] = 1;
                done = true;
            } else if (used_nums[val] < num_matches-1) {
                results[i] = val;
                used_nums[val]++;
                done = true;
            }
        }
    }

    return {
        numbers: results
    };

}