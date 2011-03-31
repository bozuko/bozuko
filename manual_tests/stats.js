var stats = Bozuko.require('util/stats');
var assert = require('assert');

exports['stats collect'] = function() {
    stats.collect_all(function(err, val){
        assert.isNull(err);
        assert.eql(val, 'ok');
    });
};