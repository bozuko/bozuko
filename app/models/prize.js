var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var Prize = module.exports = new Schema({
    contest_id              :{type:ObjectId, index:true},
    page_id                 :{type:ObjectId, index:true},
    user_id                 :{type:ObjectId, index:true},
    value                   :{type:Number},
    name                    :{type:String},
    image                   :{type:String},
    status                  :{type:String},
    message                 :{type:String},
    expires                 :{type:Date},
    play_cursor             :{type:Number},
    description             :{type:String},
    details                 :{type:String},
    instructions            :{type:String},
    redeemed                :{type:Boolean},
    redeemed_time           :{type:Date}
});

// setup our constants
Prize.REDEEMED = 'redeemed';
Prize.ACTIVE = 'active';
Prize.EXPIRED = 'expired';

Prize.method('redeem', function(user, callback){
    if( this.redeemed ){
        // not sure if we should throw an error...
        return callback( Bozuko.error('prize/already_redeemed') );
    }
    var now = new Date();
    if( this.expires > now ){
        // ruh-roh.
        return callback( Bozuko.error('prize/expired') );
    }
    if( ''+user._id != ''+this.user_id ){
        return callback( Bozuko.error('prize/redeem_bad_user') );
    }
    // looks like we got past all the error conditions....
    this.redeemed = true;
    this.redeemed_time = now;
    this.save( function(error, prize){
        if( error ) return callback( error );
        // okay, lets get the page and get its security image
        return Bozuko.models.Page.getById(prize.page_id, function(error, page){
            if( error ) return callback( error );
            return callback(null, {
                security_img: page.security_img,
                prize: prize
            });
        });
    });
});
