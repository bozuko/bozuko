var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId,
    Services = require('./embedded/service'),
    crypto = require('crypto'),
    Prize = require('./embedded/user/prize'),
    async = require('async')
    ;

var hmac = crypto.createHmac('sha512', Bozuko.config.key);

var User = module.exports = new Schema({
    name                :{type:String},
    phones              :[],
    token               :{type:String},
    salt                :{type:Number},
    first_name          :{type:String},
    last_name           :{type:String},
    image               :{type:String},
    gender              :{type:String},
    email               :{type:String, index: true},
    sign_up_date        :{type:Date, default: Date.now},
    favorites           :[ObjectId],
    can_manage_pages    :{type:Boolean}
});

Services.initSchema(User);

User.pre('save', function(next) {
    if (!this.token) {
        return create_token(this, 1, next);
    }
    return next();
});

User.static('updateFacebookLikes', function(ids, callback){
    if( !Array.isArray(ids) ) ids = [ids];
    Bozuko.models.User.findByService('facebook', ids, function(error, users){
        if( error ) callback(error);
        async.forEachSeries( users, function(user, cb){
            // grab their likes
            Bozuko.service('facebook').user_favorites(user, function(error, fb_user){
                if( error ) return callback( error );
                var fb = user.service('facebook');
                if( !fb ) return cb( Bozuko.error('bozuko/user_no_facebook') );
                if( !fb.internal ) fb.internal = {};
                fb.internal.likes = fb_user.data.likes;
                fb.commit('internal');
                return user.save(function(error){
                    if( error ) return cb(error);
                    return cb();
                });
            });
        }, function(error){
            if(error) callback(error);
            callback(null, true);
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

User.static('addOrModify', function(user, phone, service, callback) {
    var q;
    var service_id = {'services.name':service,'services.sid':user.id};
    if (service === 'facebook') {
        q = {
            $or:[
                {email:user.email},
                service_id
            ]
        };
    } else {
        q = {
            $or:[
                {email:user.contact.email},
                service_id
            ]
        };
    }

    Bozuko.models.User.findOne(q, function(err, u){
        if (err) return callback(err);

        if( !u ){
            u = new Bozuko.models.User();
        }

        if (service === 'facebook') {
            u.name = user.name;
            u.first_name = user.first_name;
            u.last_name = user.last_name;
            u.email = user.email;
            u.facebook_id = user.id;
            u.facebook_auth = user.token;
        } else {
            u.name = user.firstName+' '+user.lastName;
            u.first_name = user.firstName;
            u.last_name = user.lastName;
            u.email = user.contact.email;
        }
        u.gender = user.gender;
        var val = u.verify_phone(phone);
        if (val === 'mismatch') {
            return callback(Bozuko.error('login/phone_type_mismatch'));
        } else if (val === 'new') {
            u.phones.push(phone);
        }

        u.service(service, user.id, user.token, user);
        u.save(function(err) {
            if (err) return callback(err);
            return callback(null, u);
        });
    });
});

User.method('verify_phone', function(phone) {
        var phone_type_mismatch = false;

        if (u.phones.every(function(p) {
            if (p.type === phone.type && p.id === phone.id) {
                return false;
            } else if (p.type !== phone.type && p.id === phone.id) {
                console.log("Error: attempt to change phone type from "+p.type+" to "+phone.type+" for facebook id: "+user.id);
                phone_type_mismatch = true;
                return false;
            }
            return true;
        })) {
            console.log("New Phone added: "+JSON.stringify(phone)+" for facebook id: "+user.id);
            return 'new';
        }
        if (phone_type_mismatch) return 'mismatch';
        return 'match';
});



function create_token(user, salt, next) {
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
