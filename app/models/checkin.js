var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var Checkin = new Schema({
    
    user_facebook_id        :{type:String, index: true},
    user_id                 :{type:String, index: true},
    place_id                :{type:String, index: true},
    place_facebook_id       :{type:String},
    timestamp               :{type:Date, default: Date.now},
    message                 :{type:String},
    game_id                 :{type:Number},
    game_name               :{type:String},
    game_result             :{type:Array}
});

module.exports = Checkin;