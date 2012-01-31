process.env.NODE_ENV='test';
var bozuko = require('../../../bozuko');
var TimeEngine = require('../time');
var inspect = require('util').inspect;

exports['Don\'t Fail with 0 tokens'] = function(test) {
   test.ok(!TimeEngine.failEarly(0)); 
   test.done();
};

exports['Fail ~75% of the time']  = function(test) {
    var failures = 0;
    for (var i = 0; i < 1000; i++) {
      if (TimeEngine.failEarly(2)) failures++; 
    }
    console.log('Failed Early '+failures+' times');
    test.ok(failures >= 700);
    test.ok(failures <= 800);
    test.done();
};
