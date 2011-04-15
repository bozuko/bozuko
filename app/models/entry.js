var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId
;

var Entry = module.exports = new Schema({
    contest_id              :{type:ObjectId, index :true},
    user_id                 :{type:ObjectId},
    parent_id               :{type:ObjectId},
    type                    :{type:String},
    action_id               :{type:ObjectId},
    timestamp               :{type:Date, default: Date.now},
    token_expiration        :{type:Date},
    entry_expiration        :{type:Date},
    location                :{
        longitude               :{type:Number},
        latitude                :{type:Number}
    },
    tokens                  :{type:Number},
    initial_tokens          :{type:Number},
    data                    :{}
});

Entry.method('decrementTokens', function(callback) {
    var self = this;
    if (this.tokens === 0) {
        return callback(Bozuko.error('entry/no_tokens', this));
    }
    Bozuko.models.Entry.update(
        {_id: self._id, tokens: self.tokens},
        {tokens: self.tokens - 1},
        function(err, object) {
            if (err) {
                return Bozuko.models.Entry.findById(self._id, function(err, entry) {
                    if (err) return callback(err);

                    if (entry.tokens === 0) {
                        return callback(Bozuko.error('entry/no_tokens'), self);
                    }
                    return entry.decrementTokens(callback);
                });
            }
            return callback(null, self.tokens - 1);
        }
    );
});