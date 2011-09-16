var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId
;

var Payment = module.exports = new Schema({
    pp_refid                      :{type:String},
    pp_txid                       :{type:String},
    pp_status                     :{type:String},
    type                          :{type:String, enum: ['debit','credit','error']},
    page_id                       :{type:ObjectId},
    users                         :[ObjectId],
    billing_id                    :{type:ObjectId, index: true},
    items                         :{type:ObjectId},
    timestamp                     :{type:Date},
    amount                        :{type:Number},
    card_owner                    :{type:String},
    card_type                     :{type:String},
    card_last4                    :{type:String},
    card_expire                   :{type:String}
}, {safe: {w:2, wtimeout: 5000}});

