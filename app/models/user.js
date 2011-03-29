var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId,
    Services = require('./embedded/service'),
    crypto = require('crypto')
    ;

var hmac = crypto.createHmac('sha512', Bozuko.config.key);

var User = module.exports = new Schema({
    name                :{type:String},
    token               :{type:String},
    salt                :{type:Number},
    first_name          :{type:String},
    last_name           :{type:String},
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
    next();
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
        create_token(user, salt+1, next);
    });
};