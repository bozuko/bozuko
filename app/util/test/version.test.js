var version = require('./../version');

exports['Test Version Compare'] = function(test) {
    var comparisons = [
        ['1.0', '1.2', -1],
        ['1.2', '1.0', 1],
        ['1.0', '1.0', 0],
        ['1.0b', '1.0', -1],
        ['1.0rc', '1.0b', 1],
        ['1.0rc.2', '1.0rc.3', -1],
        ['0b', '0a', 1],
        ['1.0','1', 0],
        ['1','2.0.3', -1]
    ];
    comparisons.forEach( function(c){
        test.ok( version.compare(c[0], c[1]) === c[2] );
    });
    test.done();
};