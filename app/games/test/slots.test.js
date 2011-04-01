var assert = require('assert');

// Mock contest
var contest = {
    game_config: {}
};

var Slots = require('../slots/index.js');
var slots = new Slots(contest);

exports['lose'] = function() {
    var result = slots.process(false);
    assert.notEqual(result[0], result[1]);
    assert.notEqual(result[0], result[2]);
    assert.notEqual(result[1], result[2]);
};

exports['win'] = function() {
    var result = slots.process(3);
    assert.eql(result[0], 'banana');
    assert.eql(result[0], result[1]);
    assert.eql(result[1], result[2]);
};