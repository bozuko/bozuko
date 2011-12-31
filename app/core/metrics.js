var min = 60000,
    hr = 60*min,
    day = 24*hr,
    week = 7*day,
    year = 52*week
;

/*
 * Based on the start time and end time determine which metric granularities (buckets) to return.
 * Every time the user zooms or scrolls new data will be retrieved. Return nearby buckets so
 * zoom-in/out is smooth. Also return slightly more data than requested so scrolling is smooth.
 */
exports.get = function(options, callback) {
    var buckets = [];
    var rv = {};
    var window = options.end.getTime() - options.start.getTime();
    if (window < hr*3) {
        buckets.push('MetricsMinutely');
    }
    if (window < hr*72) {
        buckets.push('MetricsHourly');
    }
    if (window > hr*24) {
        buckets.push('MetricsDaily');
    }
    return async.forEachSeries(buckets, function(bucket, cb) {
        return Bozuko.models[bucket].findMetrics(options, function(err, docs) {
            if (err) return cb(err);
            rv[bucket] = docs;
            return cb();
        });
    }, function(err) {
        if (err) return callback(err);
        return cb(null, rv);
    });
};

exports.rebuild = function(options, callback) {
};


var models = ['MetricsDaily', 'MetricsHourly', 'MetricsMinutely'];
exports.update = function(field, value) {
    models.forEach(function(model) {
        Bozuko.models[model].updateMetrics(field, value);
    });
};
