var async = require('async'),
testsuite = require('./config/testsuite');
;

exports['cleanup'] = function(test) {
    async.forEachSeries(
        ['MetricsMinutely', 'MetricsHourly', 'MetricsDaily'],
        function(model, cb) {
            Bozuko.models[model].remove({}, cb);
        }, function(err) {
            test.done();
        }
    );
};
   
var date = new Date();
var timestamp = new Date(date.getFullYear(), date.getMonth(), date.getDate());
exports['update metrics for 1 field with no value'] = function(test) {
    Bozuko.models.MetricsDaily.updateMetrics('entries');
    
    // since the updateMetrics call is not made in safe mode, give time for the update
    // to go through.
    return setTimeout(function() {
        return Bozuko.models.MetricsDaily.findOne(
            {timestamp: timestamp},
            function(err, metrics) {
                test.ok(!err);
                test.equal(metrics.entries.ct, 1);
                test.done();
            }
        );
    }, 1000);
};

exports['update metrics for another field with a value'] = function(test) {
    Bozuko.models.MetricsDaily.updateMetrics('win_cost', 30);
    return setTimeout(function() {
        return Bozuko.models.MetricsDaily.findOne(
            {timestamp: timestamp},
            function(err, metrics) {
                test.ok(!err);
                test.equal(metrics.entries.ct, 1);
                test.equal(metrics.win_cost.ct, 1);
                test.equal(metrics.win_cost.sum, 30);
                Bozuko.models.MetricsDaily.updateMetrics('win_cost', 50);
                return setTimeout(function() {
                    return Bozuko.models.MetricsDaily.findOne(
                        {timestamp: timestamp},
                        function(err, metrics) {
                            test.ok(!err);
                            test.equal(metrics.entries.ct, 1);
                            test.equal(metrics.win_cost.ct, 2);
                            test.equal(metrics.win_cost.sum, 80);
                            test.done();
                        }
                    );
                }, 1000);
            }
        );
    }, 1000);
};
