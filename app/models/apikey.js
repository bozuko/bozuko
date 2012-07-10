var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId
;

var Apikey = module.exports = new Schema({
    timestamp               :{type:Date,        default:Date.now},
    key                     :{type:String},
    secret                  :{type:String},
    name                    :{type:String},
    description             :{type:String}
});

Apikey.pre('save', function(next) {
    var self = this;
    if( !this.key || this.key == '' ){
        this.key = create_key(32);
    }
    if( !this.secret || this.secret == '' ){
        this.secret = create_key(32);
    }
    return next();
});

function create_key(len)
{
    var key=''
      , pool = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz"
      ;
    for(var i=0; i<len; i++){
        key += pool.charAt(Math.random()*pool.length);
    }
    return key;
}