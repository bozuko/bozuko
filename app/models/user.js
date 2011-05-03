var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId,
    Services = require('./plugins/services'),
    crypto = require('crypto'),
    Phone = require('./embedded/user/phone'),
    async = require('async')
    ;

var User = module.exports = new Schema({
    name                :{type:String},
    phones              :[Phone],
    token               :{type:String},
    salt                :{type:Number},
    challenge           :{type:Number},
    first_name          :{type:String},
    last_name           :{type:String},
    image               :{type:String},
    gender              :{type:String},
    email               :{type:String, index: true},
    sign_up_date        :{type:Date, default: Date.now},
    favorites           :[ObjectId],
    can_manage_pages    :{type:Boolean}
});

User.plugin(Services);

User.pre('save', function(next) {
    if (!this.challenge) {
        this.challenge = Math.floor(Math.random()*100000);
    }
    if (!this.token) {
        return create_token(this, 1, next);
    }
    return next();
});

User.method('like', function(page, callback){
    var self = this;
    if( typeof page != 'string' ){
        try{
            page = page.service('facebook').sid;
        }catch(e){
            callback( Bozuko.error('user/like_bad_page') );
        }
    }
    // okay, this should be a facebook string
    Bozuko.service('facebook').like({user: self, object_id: page}, callback);
});

User.method('likes', function(page){
    // check to see if the user already likes a page
    var self = this;
    if( typeof page != 'string' ){
        try{
            page = page.service('facebook').sid;
        }catch(e){
            callback( Bozuko.error('user/like_bad_page') );
        }
    }
    var fb = self.service('facebook');
    if( !fb || !fb.internal ) return false;
    
    var likes = fb.internal.likes || [];
    return ~likes.indexOf( page );
});

User.method('updateLikes', function(callback){
    var self = this;
    if( !self.service('facebook')) return callback( Bozuko.error('user/no_facebook') );
    return Bozuko.service('facebook').user_favorites({user:self}, function(error, result){
        if( error ) return callback( error );
        var likes = [];
        try{
            var data = result.data.likes.data;
            data.forEach(function(object){
                likes.push(object.id);
            });
        }catch(e){
            likes = [];
        }
        if( !self.service('facebook').internal ){
            self.service('facebook').internal = {};
        }
        self.service('facebook').internal.likes = likes;
        self.service('facebook').commit('internal');
        self.commit('services');
        return self.save(callback);
    });
});

User.static('updateFacebookLikes', function(ids, callback){
    if( !Array.isArray(ids) ) ids = [ids];
    Bozuko.models.User.findByService('facebook', ids, function(error, users){
        if( error ) callback(error);
        async.forEachSeries( users, function(user, cb){
            // grab their likes
            return user.updateLikes( cb );
        }, function(error){
            if(error) return callback(error);
            return callback(null, true);
        });
    });
});

User.static('createFromServiceObject', function(user, callback){
    var id = user.id;
    var service = user.service;
    var data = user.data;
    delete user.data;
    delete user.id;
    delete user.service;
    var u = new Bozuko.models.User();
    Object.keys(user).forEach(function(prop){
        u.set(prop, user[prop]);
    });
    u.service( service, id, null, data);
    u.save( function(error){
        if( error ){
            return callback( error );
        }
        return Bozuko.models.User.findById(u.id, callback);
    });
});

User.static('addOrModify', function(user, phone, callback) {
    var q;
    var service_id = {'services.name':user.service,'services.sid':user.id};
    q = {
        $or:[
            {email:user.email},
            service_id
        ]
    };

    Bozuko.models.User.findOne(q, function(err, u){
        if (err) return callback(err);
        
        var isNew = false;

        if( !u ){
            u = new Bozuko.models.User();
            isNew = true;
            u.name = user.name;
            u.first_name = user.first_name;
            u.last_name = user.last_name;
            u.image = user.image;
            u.email = user.email;
            u.gender = user.gender;
        }

        if (phone) {
            var result = u.verify_phone(phone);
            if (result === 'new') {
                console.log("New Phone added: "+JSON.stringify(phone)+" for facebook id: "+u.id);
                u.phones.push(phone);
            } else if (result === 'mismatch') {
                return callback(Bozuko.error('auth/mobile'));
            }
        }

        u.service(user.service, user.id, user.token, user.data);
        return u.save(function(err) {
            if (err) return callback(err);
            return callback(null, u);
        });
    });
});

User.method('verify_phone', function(phone) {
        var self = this, found = false, mismatch=false;
        for(var i=0; i<this.phones.length && !found && !mismatch; i++){
            var p = this.phones[i];
            if (p.type === phone.type && p.unique_id === phone.unique_id) {
                found =true;
            } else if (p.type !== phone.type && p.unique_id === phone.unique_id) {
                // udid does not match the saved phone type
                mismatch = true;
            }
        }
        if(mismatch) return 'mismatch';
        if(found) return 'match';
        return 'new';
});


function create_token(user, salt, next) {
    var hmac = crypto.createHmac('sha512', Bozuko.config.key);
    var token = hmac.update(user.name+salt).digest('hex');
    Bozuko.models.User.findOne({token: token}, function(err, u) {
        if (err) return next(err);
        if (!u) {
            user.token = token;
            user.salt = salt;
            return next();
        }
        // We've got a collision.
        return create_token(user, salt+1, next);
    });
};
