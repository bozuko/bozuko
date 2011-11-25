var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var NextContest = module.exports = new Schema({
    contest_id:       {type:ObjectId},
    active:           {type:Boolean, default: false}
});
