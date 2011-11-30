var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var safe = {w:2, wtimeout:5000};

var Reward = module.exports = new Schema({
    name                    :{type:String},
    value                   :{type:Number},
    image                   :{type:String},
    description             :{type:String},
    total                   :{type:Number},
    claimed                 :{type:Number, default: 0},
    bucks                   :{type:Number}
}, {safe: safe});

Reward.method('claim', function(user, callback) {
    var self = this;
    if (user.bucks < this.bucks) return callback(Bozuko.error('reward/not_enough_bucks'));
    return Bozuko.models.Reward.findAndModify(
        {_id: this._id, claimed: {$lt: this.total}}, [],
        {$inc: {claimed: 1}},
        {new: true, fields: {claimed: 1}, safe: safe},
        function(err, reward) {
            if (err) return callback(err);
            if (!reward) return callback(Bozuko.error('reward/no_more', self));
            return callback();
        }
    );
});

