var testsuite = require('./config/testsuite');

// Mock contest
var contest = {
    game_config: {},
    prizes:[{},{},{},{}]
};

var Slots = require('../slots/index.js');
var slots = new Slots(contest);

exports['lose'] = function(test, keepgoing) {
    var result = slots.process(false);
    test.ok( result[0] != result[1] || result[0] != result[2] );
    if( !keepgoing ) test.done();
};

exports['lose a bunch'] = function(test){
    for(var i=0; i<500; i++){
        exports['lose'](test, true);
    }
    test.done();
}

exports['win'] = function(test) {
    var result = slots.process(3);
    var icon = slots.getConfig().icons[3];
    test.equal(result[0], icon);
    test.equal(result[0], result[1]);
    test.equal(result[1], result[2]);
    test.done();
};

exports['free_spin'] = function(test) {
    var result = slots.process(4);
    test.equal(result[0], 'free_spin');
    test.equal(result[0], result[1]);
    test.equal(result[1], result[2]);
    test.done();
};