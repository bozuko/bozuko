var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var Prize = module.exports = new Schema({
    value                   :{type:Number},
    duration                :{type:Number},
    image                   :{type:String},
    name                    :{type:String},
    description             :{type:String},
    details                 :{type:String},
    instructions            :{type:String},
    total                   :{type:Number},
    redemption_method       :{type:String, default:'bozuko'},
    claimed                 :{type:Number, default: -1},
    won                     :{type:Number, default: 0},
    redeemed                :{type:Number, default: 0},
    is_email                :{type:Boolean, default: false},
    email_body              :{type:String},
    email_codes             :[String],
    is_barcode              :{type:Boolean, default: false},
    barcode_type            :{type:String, default: '39'},
    barcodes                :[String]
});
