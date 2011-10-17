var Engine = Bozuko.require('core/contest/engine'),
    rand = Bozuko.require('util/math').rand,
    inherits = require('util').inherits;

var TimeEngine = module.exports = function() {
    Engine.apply(this, arguments);
};

inherits(TimeEngine, Engine);

TimeEngine.prototype.generateResults = function() {
    var options = this.contest.engine_options || {};        
    var contest = this.contest;
    var results = [];
    var prizes = contest.prizes;
    var start = contest.start.getTime();
    var end = contest.end.getTime();

    prizes.forEach(function(prize, prize_index) {
        for (var i = 0; i < prize.total; i++) {
            var result = {
                index: prize_index,
                prize: prize._id,
                code: this.getCode(),
                count: i,
                timestamp: new Date(rand(start, end))
            };
            results.push(result);
        }
    });
    
    contest.results = results;
    
};

TimeEngine.prototype.play = function() {
};
