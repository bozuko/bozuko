var Game = Bozuko.require('core/game'),
    burl = Bozuko.require('util/url').create,
    rand = Bozuko.require('util/math').rand,
    path = require('path'),
    inherits = require('util').inherits;

var Scratch = module.exports = function() {
    Game.apply(this,arguments);
};

inherits( Scratch, Game );

Scratch.prototype.type = path.basename(__dirname);

Scratch.prototype.name = "Scratch";

Scratch.prototype.icon = burl('/games/scratch/scratch_icon.png');

Scratch.prototype.getTheme = function(){
    var theme;
    if (!this.config.theme) {
        theme = 'default';
    } else {
        theme  = typeof this.config.theme == 'string'
            ? this.config.theme
            : (typeof this.config == 'object'
               ? this.config.theme.name
               : 'default');
    }
    var Theme = require('./themes/'+theme);
    return new Theme(this);
};

Scratch.prototype.getConfig = function(){
    var theme = this.getTheme();
    return {
        theme: {
            name: theme.name,
            base: theme.base,
            images: theme.images
        }
    };
};

Scratch.prototype.getListImage = function(){
    return this.getTheme().getListImage();
};

var min = 1,
    max = 20;

var size = 6;
var num_matches = 3;

Scratch.prototype.process = function(outcome) {
    var numbers;
    if (outcome === false) {
        numbers = lose(this.contest);
    } else {
        numbers = win(this.contest, outcome);
    }
    return numbers;
};

function randomPrize( contest, exclude ){
    var ar = [], prizes = contest.prizes.slice(0);
    
    if( contest.consolation_config && contest.consolation_config.length &&
        contest.consolation_prizes && contest.consolation_prizes.length
    ){
        prizes = prizes.concat( contest.consolation_prizes.slice(0, 1) );
    }
    
    if( exclude === undefined || exclude === prizes.length ) prizes.push({name:'Free Play'});
    for( var i=0; i < prizes.length; i++) ar.push(i);
    if( exclude !== undefined && exclude < prizes.length ) ar.splice( exclude, 1);
    return prizes[rand(0,ar.length-1)].name;
}

function win(contest, winIndex) {
    var ar = [], prize;
    for (var i = 0; i < size; i++) { ar[i] = i; }

    if( winIndex === 'free_play' ){
        // free spin!
        prize = {name:'Free Play'};
    }
    
    else if( winIndex === 'consolation'){
        prize = contest.consolation_prizes[0];
    }
    
    else{
        prize = contest.prizes[winIndex];
    }

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
    var used_nums = {}, num_prizes = {};
    var val;

    // fill in other positions
    for (i = 0;  i < ar.length; i++) {
        var index = ar[i];
        done = false;
        while (!done) {
            val = rand(min, max);
            if (val != winning_number) {
                if (!used_nums[val]) {
                    num_prizes[val] = randomPrize(contest, winIndex);
                    results[index] = {
                        number: val,
                        text: num_prizes[val]
                    };
                    used_nums[val] = 1;
                    done = true;
                } else if (used_nums[val] < num_matches-1) {
                    results[index] = {
                        number: val,
                        text: num_prizes[val]
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
    var used_nums = {}, num_prizes={};
    var done = false;
    var val;

    for (var i = 0; i < size; i++) {
        done = false;
        while (!done) {
            val = rand(min, max);
            if (!used_nums[val]) {
                num_prizes[val] = randomPrize(contest);
                results[i] = {
                    number: val,
                    text: num_prizes[val]
                };
                used_nums[val] = 1;
                done = true;
            } else if (used_nums[val] < num_matches-1) {
                results[i] = {
                    number: val,
                    text: num_prizes[val]
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