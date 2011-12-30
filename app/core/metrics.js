var min = 60000,
    hr = 60*min,
    day = 24*hr,
    week = 7*day,
    year = 52*week
;

exports.configure = function(models) {
    this.models = models;
};

/*
 * Based on the start time and end time determine which metric granularities (buckets) to return.
 * Every time the user zooms or scrolls new data will be retrieved. Return nearby buckets so
 * zoom-in/out is smooth. Also return slightly more data than requested so scrolling is smooth.
 */
exports.get = function(options, callback) {
    var buckets = [];
    var window = options.end.getTime() - options.start.getTime();
    if (window < hr*3) {
        buckets.push('minutes');
    }
    if (window < hr*72) {
        buckets.push('hours');
    }
    if (window < day*180 && window > hr*24) {
        buckets.push('days');
    }
    if (window > day*7 && window < year*3) {
        buckets.push('weeks');
    }
};

exports.rebuild = function(options, callback) {
};

exports.schema = {
    timestamp: {type: Date, index: true},
    entries: {},
    plays: {},
    wins: {},
    redemptions: {},
    win_cost: {},
    redemption_cost: {},
    fb_posts: {},
    fb_likes: {},
    fb_checkins: {},
    unique_users: {},
    new_users: {}
};

exports.update = function(field, value) {
    models.forEach(function(model) {
        model.updateMetrics(field, value);
    });
};
