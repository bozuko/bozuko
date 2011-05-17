var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var ConsolationConfig = module.exports = new Schema({
    // who is one of: 'all', 'losers'
    who             :{type:String},
    // when is one of: 'always', 'once', 'interval'
    when            :{type:String},
    // duration is only applicable when when === 'interval'
    duration        :{type:Number, default: 0}
});
