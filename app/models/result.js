var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId
;

var Result = module.exports = new Schema({
    contest_id      :{type:ObjectId, index: true},
    entry_id        :{type:ObjectId},
    user_id         :{type:ObjectId},
    page_id         :{type:ObjectId},
    page_prize      :{type:Boolean}, // Whether this prize is embedded in the page not contest
    index           :{type:Number},
    code            :{type:String},
    count           :{type:Number},
    timestamp       :{type:Date, index: true},
    history         :[], // old timestamps so we can track movement
    win_time        :{type:Date, index: true}
});
