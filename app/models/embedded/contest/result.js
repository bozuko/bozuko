var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId,
    Oid = mongoose.Types.ObjectId
;

var Result = module.exports = new Schema({
    index:          {type:Number},
    prize:          {type:ObjectId},
    code:           {type:String},
    count:          {type:Number},
    // Use a sparse index because order engine results don't have timestamps
    timestamp:      {type:Date, index: {sparse: true}}
});
