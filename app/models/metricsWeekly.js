var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId
;


/* Each metric looks like the following and consists only of aggregates
 *
 * metric: {
 *     sum: Number,
 *     ct: Number
 * }
 *
 * The timestamp is pruned to the hour like so
 * timestamp: "Thu Dec 22 2011 24:00:00 GMT-0500"
 */

var MetricsWeekly = module.exports = new Schema({
    contest_id: {type: ObjectId, index: true},
    page_id: {type: ObjectId, index: true},
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
});
