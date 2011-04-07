var testsuite = require('./config/testsuite');

// Mock contest
var contest = {
    game_config: {}
};

var Slots = require('../slots/index.js');
var slots = new Slots(contest);

exports['lose'] = function(test) {
    var result = slots.process(false);
    test.notEqual(result[0], result[1]);
    test.notEqual(result[0], result[2]);
    test.notEqual(result[1], result[2]);
    test.done();
};

exports['win'] = function(test) {
    var result = slots.process(3);
    test.equal(result[0], 'banana');
    test.equal(result[0], result[1]);
    test.equal(result[1], result[2]);
    test.done();
};