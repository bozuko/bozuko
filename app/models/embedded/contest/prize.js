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
    claimed                 :{type:Number, default: -1},
    is_email                :{type:Boolean, default: false},
    email_body              :{type:String},
    email_codes             :[String],
    is_barcode              :{type:Boolean, default: false},
    barcode_type            :{type:String, default: 'upc'},
    barcodes                :[String]
});
