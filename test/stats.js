var bozuko = require('bozuko');
var stats = bozuko.require('util/stats');
var assert = require('assert');

exports['stats collect'] = function() {
    stats.collect_all(function(err, val){
        assert.isNull(err);
        assert.eql(val, 'ok');
    });
};