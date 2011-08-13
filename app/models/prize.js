var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    burl = Bozuko.require('util/url').create,
    LastUpdatedPlugin = require('./plugins/lastupdated'),
    JSONPlugin = require('./plugins/json'),
    ObjectId = Schema.ObjectId;

var Prize = module.exports = new Schema({
    contest_id              :{type:ObjectId, index:true},
    page_id                 :{type:ObjectId, index:true},
    user_id                 :{type:ObjectId, index:true},
    prize_id                :{type:ObjectId, index:true},
    uuid                    :{type:String},
    code                    :{type:String},
    value                   :{type:Number},
    /* page and user names for searching */
    name                    :{type:String},
    page_name               :{type:String},
    user_name               :{type:String},
    timestamp               :{type:Date, index: true},
    image                   :{type:String},
    message                 :{type:String},
    expires                 :{type:Date},
    play_cursor             :{type:Number},
    description             :{type:String},
    details                 :{type:String},
    instructions            :{type:String},
    redeemed                :{type:Boolean},
    redeemed_time           :{type:Date,    index: true},
    is_email                :{type:Boolean, default:false},
    email_body              :{type:String},
    email_code              :{type:String},
    is_barcode              :{type:Boolean, default:false},
    barcode_image           :{type:String},
    consolation             :{type:Boolean, default:false}
});

// setup our constants
Prize.REDEEMED = 'redeemed';
Prize.ACTIVE = 'active';
Prize.EXPIRED = 'expired';


Prize.plugin(LastUpdatedPlugin);
Prize.plugin(JSONPlugin);

Prize.virtual('state')
    .get(function(){
        if( this.redeemed ) return Prize.REDEEMED;
        var now = new Date();
        if( now < this.expires ) return Prize.ACTIVE;
        return Prize.EXPIRED;
    });

Prize.method('redeem', function(user, callback){
    var self = this;
    if( self.redeemed ){
        // not sure if we should throw an error...
        return callback( Bozuko.error('prize/already_redeemed') );
    }
    var now = new Date();
    if( self.state == Prize.EXPIRED ){
        // ruh-roh.
        return callback( Bozuko.error('prize/expired') );
    }
    if( String(user._id) != String(this.user_id) ){
        return callback( Bozuko.error('prize/redeem_bad_user') );
    }
    // looks like we got past all the error conditions....
    self.redeemed = true;
    self.redeemed_time = now;
    return self.save( function(error){
        if( error ) return callback( error );
        if (self.is_email) self.sendEmail(user);
        
        // this 'if' is for backwards compatability
        if( self.prize_id ) Bozuko.models.Contest.collection.update(
            {'prizes._id':self.prize_id},
            {$inc: {'prizes.$.redeemed':1}},
            function(error){
                if( error ) console.error( error );
                else console.log('updated redeemed');
            }
        );
        
        // okay, lets get the page and get its security image
        return Bozuko.models.Page.findById(self.page_id, function(error, page){
            if( error ) return callback( error );
            self.user = user;
            self.page = page;
            Bozuko.publish('prize/redeemed', {prize_id: self._id, contest_id: self.contest_id, page_id: self.page_id, user_id: self.user_id} );
            return callback(null, {
                security_image: page.security_img || burl('/images/security_image.png'),
                prize: self
            });
        });
    });
});

// Don't bother waiting for this. Just fire and forget. We should have a way for the user
// to request the email to be resent.
Prize.method('sendEmail', function(user) {
    var self = this;
    var mail = Bozuko.require('util/mail');
    return mail.send({
        to: user.email,
        subject: 'You just won a Bozuko prize!',
        body: 'Gift Code: '+self.email_code+"\n\n\n"+self.email_body
    }, function(err, success) {
        if (err) console.log("Email Err = "+err);
        if (err || !success) {
            console.log("Error sending mail to "+user.email+"for prize_id"+self._id);
        }
    });
});

Prize.method('loadTransferObject', function(callback){
    var self = this;
    return Bozuko.models.Page.findById(self.page_id, function(error, page){
        if( error ) return callback( error );
        self.page = page;
        return Bozuko.models.User.findById(self.user_id, function(error, user){
            if( error )  return callback( error );
            self.user = user;
            return callback( null, self );
        });
    });
});

Prize.static('getLastUpdated', function(selector, callback){
    var s = {};
    selector = selector || {};
    Object.keys(selector).forEach(function(key){
        s[key] = selector[key];
    });
    s.last_updated = {$exists: true};
    options = {sort: {last_updated:-1}, limit: 1};
    Bozuko.models.Prize.find(s, {}, options, function(error, prizes){
        if( error ) return callback(error);
        if( !prizes.length ) return callback(null, null);
        return callback( null, prizes[0] );
    });
});

Prize.static('search', function(){
    var callback = arguments[arguments.length-1];
    arguments[arguments.length-1] = function(error, prizes){

        if( error ) return callback( error );

        // no prizes, just send back the empty array then
        if( prizes.length == 0 ){
            return callback(null, prizes);
        }

        // else, lets go through each page and load users and pages
        var page_ids = [],
            user_ids = [],
            page_map = {},
            user_map = {};

        prizes.forEach(function(prize){

            page_ids.push(prize.page_id);
            if( !page_map[prize.page_id] ) page_map[prize.page_id] = [];
            page_map[prize.page_id].push( prize );

            user_ids.push(prize.user_id);
            if( !user_map[prize.user_id] ) user_map[prize.user_id] = [];
            user_map[prize.user_id].push( prize );

        });



        return Bozuko.models.Page.find({_id: {$in: page_ids}}, function(error, pages){
            if( error ) return callback( error );
            pages.forEach( function(page){
                var _prizes = page_map[page.id];
                _prizes.forEach( function(_prize){
                    _prize.page = page;
                });
            });
            return Bozuko.models.User.find({_id: {$in: user_ids}}, function(error, users){
                if( error )  return callback( error );
                users.forEach( function(user){
                    var _prizes = user_map[user.id];
                    _prizes.forEach( function(_prize){
                        _prize.user = user;
                    });
                });
                return callback( null, prizes );
            });
        });
    };
    this.find.apply( this, arguments );
});
