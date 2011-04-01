var Game = Bozuko.require('core/game');
var rand = Bozuko.require('util/math').rand;

var Scratch = module.exports = function() {
    Game.apply(this,arguments);
    this.config = this.config || {};
};

Scratch.prototype.__proto__ = Game.prototype;
var proto = Scratch.prototype;

proto.name = "Scratch";

proto.process = function(outcome) {
    var user_numbers;
    var winning_numbers = pick_winners();

    if (outcome === false) {
        user_numbers = lose(winning_numbers);
    } else {
        user_numbers = win(outcome, winning_numbers);
    }

    return {
        winning_numbers: winning_numbers,
        user_numbers: user_numbers
    };
};

// All winning numbers must be unique
var pick_winners = function() {
    var winning_numbers = [rand(0,100)];
    var num = rand(0, 100);
    while (num === winning_numbers[0]) {
        num = rand(0, 100);
    }
    winning_numbers.push(num);
    while (num === winning_numbers[0] || num === winning_numbers[1]) {
        num = rand(0, 100);
    }
    winning_numbers.push(num);
    return winning_numbers;
};

var lose = function(winning_numbers) {
    var num;
    var user_numbers = [];
    for (var i = 0; i < 6; i++) {
        num = rand(0,100);
        while (num === winning_numbers[0] || num === winning_numbers[1] || num === winning_numbers[2]) {
            num = rand(0,100);
        }
        user_numbers.push(num);
    }
    return user_numbers;
};

// winning_numbers[match_index] must equal exactly 1 user number;
var win = function(match_index, winning_numbers) {
    var user_numbers = [];
    var user_match = rand(0, 5);
    for (var i = 0; i < 6; i++) {
        if (user_match === i) {
            user_numbers.push(winning_numbers[match_index]);
        } else {
            var num = rand(0,100);
            while (num === winning_numbers[0] || num === winning_numbers[1] || num === winning_numbers[2]) {
                num = rand(0,100);
            }
            user_numbers.push(num);
        }
    }
    return user_numbers;
};