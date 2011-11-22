process.env.NODE_ENV='test';

// Mock contest
var contest = {};

var Engine = require('../../engine');
var engine = new Engine(contest);

exports['engine.intToCode() - ensure conversion from integer to code works'] = function(test) {
    for (var i = 0; i < 1000; i++) {
        var val = Math.floor(Math.random()*1000000000);
        var code = engine.intToCode(val);
        var calculated = engine.codeToInt(code);
        console.log(code);
         test.equal(calculated, val);
    }
    test.done();
};
