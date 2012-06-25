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

function win(contest, winIndex) {
    var ar = createSequenceArray(), 
        prizes = createPrizes(contest, winIndex);
        prize = getPrize(contest, prizes, winIndex),
        winning_number = rand(min, max),
        results = [];

    fillInWinningPositions(ar, results, winning_number, prize);
    fillInLosingPositions(ar, results, winning_number, prizes);

    return {
        winning_number: winning_number,
        numbers: results
    };
}

function lose(contest) {
    var results = [],
        ar = createSequenceArray(), 
        prizes = createPrizes(contest);

    fillInLosingPositions(ar, results, -9999, prizes);

    return {
        numbers: results
    };
}

function getPrize(contest, prizes, winIndex) {
    if( winIndex === 'free_play' ) return {name:'Free Play'};
    if( winIndex === 'consolation') return contest.consolation_prizes[0];
    var prize = prizes[winIndex];
    prizes.splice(winIndex, 1);
    return prize;
}

function createSequenceArray() {
    var ar = [];
    for (var i = 0; i < size; i++) { ar[i] = i; }
    return ar;
}

function createPrizes(contest, winIndex) {
    var prizes = contest.prizes.slice(0);
    if( contest.consolation_config && contest.consolation_config.length &&
        contest.consolation_prizes && contest.consolation_prizes.length
    ){
        prizes = prizes.concat( contest.consolation_prizes.slice(0, 1) );
    }
    if (winIndex != 'free_play') prizes.push({name:'Free Play'});
    return prizes;
}

function getPrizeIndex(prizes) {
    var indexes = [];
    for( var i=0; i < prizes.length; i++) indexes.push(i);
    return rand(0, indexes.length - 1);
}
    
function randomPrize(prizes){
    if (!prizes.length) return 'no prize'; 
    var index = getPrizeIndex(prizes);
    var prize = prizes[index];
    prizes.splice(index, 1);
    return prize.name; 
}

function fillInWinningPositions(ar, results, winning_number, prize) {
    for (i = 0; i < num_matches; i++) {
        var random = rand(0, ar.length-1);
        var index = ar[random];
        ar.splice(random, 1);
        results[index] = {
            number: winning_number,
            text: prize.name
        }
    }
}

function fillInLosingPositions(ar, results, winning_number, prizes) {
    var done;
    var used_nums = {}, num_prizes = {};
    var val;

    for (i = 0;  i < ar.length; i++) {
        var index = ar[i];
        done = false;
        while (!done) {
            val = rand(min, max);
            if (val != winning_number) {
                if (!used_nums[val]) {
                    num_prizes[val] = randomPrize(prizes);
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
}
