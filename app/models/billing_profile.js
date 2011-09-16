var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId
;

var CreditCard = new Schema({
    owner                :{type:String},
    type                 :{type:String},
    last4                :{type:String},
    expire               :{type:String}
});

var BillingProfile = module.exports = new Schema({
    pp_token            :{type:String},
    pp_profile_id       :{type:String},
    cards               :[CreditCard],
    page_id             :{type:ObjectId},
    users               :{type:ObjectId},
    creation_date       :{type:ObjectId},
    last_modified       :{type:ObjectId},
    active              :{type:Boolean}    
}, {safe: {w:2, wtimeout:5000}});
