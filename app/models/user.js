var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId,
    Services = require('./plugins/services'),
    Native = require('./plugins/native'),
    crypto = require('crypto'),
    Phone = require('./embedded/user/phone'),
    async = require('async'),
    merge = Bozuko.require('util/object').merge,
    DateUtil = Bozuko.require('util/date')
    ;

var MIN_FRIENDS = 4;

var User = module.exports = new Schema({
    name                :{type:String, index: true},
    phones              :[Phone],
    token               :{type:String, index: true},
    salt                :{type:Number},
    challenge           :{type:Number},
    first_name          :{type:String, index: true},
    last_name           :{type:String, index: true},
    image               :{type:String},
    gender              :{type:String},
    suspect             :{type:Boolean},
    blocked             :{type:Boolean, default: false},
    allowed             :{type:Boolean, default: false},
    email               :{type:String, index: true},
    sign_up_date        :{type:Date, default: Date.now},
    favorites           :[ObjectId],
    last_internal_update:{type:Date},
    can_manage_pages    :{type:Boolean},
    manages             :[ObjectId]
});

User.plugin(Services);
User.plugin(Native);

User.pre('save', function(next) {
    if (!this.challenge) {
        this.challenge = Math.floor(Math.random()*100000);
    }
    if (!this.token) {
        return create_token(this, 1, next);
    }
    return next();
});

User.method('isBlocked', function(){
    return this.blocked && !this.allowed;
});

User.method('canManage', function(page, callback){
    var self = this;
    if( typeof page === 'object' && page.isAdmin && typeof page.isAdmin === 'function' ){
        return page.isAdmin( this, callback );
    }
    if( typeof page === 'string' ){
        return Bozuko.models.Page.findOne({admins: self._id, _id: page}, function(error, page){
            if( error ) return callback( error );
            return callback( null, page ? true : false );
        });
    }
    return callback( new Error('page parameter is invalid - must be a Page model, or a string id'));
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
            console.log(e);
            throw new Error('where is this bad page coming from');
        }
    }
    var fb = self.service('facebook');
    if( !fb || !fb.internal ){
        return false;
    }
    var likes = fb.internal.likes || [];
    return !!~likes.indexOf( page );
});

User.method('updateInternals', function(force, callback){

    if( typeof force === 'function' ){
        callback = force;
        force = false;
    }
    if (Bozuko.config.test_mode) return callback(null);
    var self = this;
    
    var now = new Date();
    if( !force && self.last_internal_update && +now -self.last_internal_update < (1000 * 60 * 60) ){
        return callback(null);
    }
    console.log('updating internals');
    if( !self.service('facebook')) return callback( );
    return Bozuko.service('facebook').user({user:self, fields:'likes,friends'}, function(error, result){
        if( error ) return callback( error );
        var likes = [], friends = [];
        try{
            var data = result.data.likes.data;
            data.forEach(function(object){
                likes.push(object.id);
            });
        }catch(e){
            likes = [];
        }
        try{
            var data = result.data.friends.data;
            data.forEach(function(object){
                friends.push(object);
            });
        }catch(e){
            friends = [];
        }
        var commit = true;
        if( !self.service('facebook').internal ){
            self.service('facebook').internal = {};
            commit = false;
        }
        // do they have old likes?
        var old_likes = self.service('facebook').internal.likes;
        if( old_likes ){
            // lets get the recently added likes.
            var recent_likes = likes.filter(function(like){
                return !~old_likes.indexOf(like);
            });
            
            
            var internal = self.service('facebook').internal;
            if( internal.last_recent_update ){
                // check the timestamp
                if( Date.now() - internal.last_recent_update  < DateUtil.MINUTE * 5 ){
                    // lets combine the old likes and these likes
                    var previous_recent = (internal.recent_likes || []).filter(function(like){
                        return !~recent_likes.indexOf(like);
                    });
                    // lets get the difference between these arrays
                    recent_likes = recent_likes.concat(previous_recent);
                }
            }
            internal.recent_likes = recent_likes;
            internal.last_recent_update = Date.now();
        }
        self.service('facebook').internal.likes = likes;
        self.service('facebook').internal.friends = friends;
        self.service('facebook').internal.friend_count = friends.length;
        self.service('facebook').commit('internal');
        self.last_internal_update = new Date();

        // Block users with less than MIN_FRIENDS
        if (self.service('facebook').internal.friend_count < MIN_FRIENDS && !self.allowed) {
            self.blocked = true;
        }
        return self.save(function(err) {
            if (err) {
                console.error("Error saving user: "+self.name+" "+self._id);
                return callback(err);
            }
            if (self.blocked && !self.allowed) {
                console.error("Fraudulent user blocked: "+self.name+" "+self._id);
                return callback(Bozuko.error('user/blocked'));
            }

            return callback(null);
        });
    });
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
        var commit = true;
        if( !self.service('facebook').internal ){
            self.service('facebook').internal = {};
            commit = false;
        }
        self.service('facebook').internal.likes = likes;
        if( commit ) self.commit('services');
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
                console.log("New Phone added: "+JSON.stringify(phone)+" for facebook id: "+service_id);
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

User.method('getManagedPages', function(){
    // callback is the last argument
    var self = this,
        args = [].slice.apply(arguments),
        fnArgs = [], arg,
        param, params = ['selector', 'fields', 'options'],
        callback = args.pop(),
        selector = {admins:self._id}
        ;
    
    while( args.length && (arg = args.shift()) && params.length && (param = params.shift()) ){
        
        switch( param ){
            case 'selector':
                fnArgs.push( merge( selector, arg ) );
                console.log(fnArgs);
                break;
            default:
                fnArgs.push( arg );
        }
    }
    
    fnArgs.push( callback );
    Bozuko.models.Page.find.apply( Bozuko.models.Page, fnArgs );
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
