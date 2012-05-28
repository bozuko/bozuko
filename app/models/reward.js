var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var safe = {j:true};

var Reward = module.exports = new Schema({
    name                    :{type:String},
    value                   :{type:Number}, // dollars
    image                   :{type:String},
    description             :{type:String},
    code                    :{type:String},
    claimed                 :{type:Boolean, default: false},
    bucks                   :{type:Number},
    user_id                 :{type:ObjectId, index: true}
}, {safe: safe});

//Reward.index({value: 1, clamed: 1});

// 10000 bucks = $1 
var ParValue = 10000;

Reward.static('claim', function(user, value, callback) {
    if (user.bucks < value*ParValue) return callback(Bozuko.error('reward/not_enough_bucks'));
    return Bozuko.models.Reward.findAndModify(
        {value: value, claimed: false}, [],
        {$set: {claimed: true, user_id: user._id}},
        {new: true, safe: safe},
        function(err, reward) {
            if (err) return callback(err);
            if (!reward) return callback(Bozuko.error('reward/no_more'));
            return callback(null, reward);
        }
    );
});

