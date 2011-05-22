var Game = Bozuko.require('core/game'),
    burl = Bozuko.require('util/url').create,
    rand = Bozuko.require('util/math').rand;

var Scratch = module.exports = function() {
    Game.apply(this,arguments);
    this.config = this.config || {};
};

Scratch.prototype.__proto__ = Game.prototype;
var proto = Scratch.prototype;

proto.name = "Scratch";

proto.icon = burl('/games/scratch/scratch_icon.png');

var min = 1,
    max = 20;

var size = 6;
var num_matches = 3;

proto.process = function(outcome) {
    var numbers;
    if (outcome === false) {
        numbers = lose(this.contest);
    } else {
        numbers = win(this.contest, outcome);
    }

    return numbers;
};

function randomPrize( contest, exclude ){
    var ar = [];
    for( var i=0; i<contest.prizes.length; i++) ar.push(i);
    if( exclude !== undefined ) ar.splice( exclude, 1);
    return contest.prizes[rand(0,ar.length-1)].name;
}

function win(contest, winIndex) {
    var ar = [];
    for (var i = 0; i < size; i++) { ar[i] = i; }
    
    var prize = contest.prizes[winIndex];

    winning_number = rand(min, max);
    var results = [];

    // fill in winning positions
    for (i = 0; i < num_matches; i++) {
        var random = rand(0, ar.length-1);
        var index = ar[random];
        ar.splice(random, 1);
        results[index] = {
            number: winning_number,
            text: prize.name
        }
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
                    results[index] = {
                        number: val,
                        text: randomPrize(contest, winIndex)
                    };
                    used_nums[val] = 1;
                    done = true;
                } else if (used_nums[val] < num_matches-1) {
                    results[index] = {
                        number: val,
                        text: randomPrize(contest, winIndex)
                    };
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

function lose(contest) {
    var results = [];
    var used_nums = {};
    var done = false;
    var val;

    for (var i = 0; i < size; i++) {
        done = false;
        while (!done) {
            val = rand(min, max);
            if (!used_nums[val]) {
                results[i] = {
                    number: val,
                    text: randomPrize(contest)
                };
                used_nums[val] = 1;
                done = true;
            } else if (used_nums[val] < num_matches-1) {
                results[i] = {
                    number: val,
                    text: randomPrize(contest)
                };
                used_nums[val]++;
                done = true;
            }
        }
    }

    return {
        numbers: results
    };

}