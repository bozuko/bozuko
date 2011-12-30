var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    metrics = Bozuko.require('core/metrics'),
    MetricsPlugin = require('./plugins/metrics')
;

/* Each metric looks like the following and consists only of aggregates.
 * 'sum' will only be used where appropriate.
 *
 * metric: {
 *     sum: Number,
 *     ct: Number
 * }
 *
 * The timestamp is pruned to the hour like so
 * timestamp: "Thu Dec 22 2011 24:00:00 GMT-0500"
 */

var MetricsMinutely = module.exports = new Schema(metrics.schema);
MetricsMinutely.plugin(MetricsPlugin);
