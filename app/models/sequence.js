var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId
;

var Sequence = module.exports = new Schema({
    _id                     :{type:String,      index: true},
    value                   :{type:Number,      defaultValue: 1}
});

Sequence.static('next', function(name, callback){
    this.collection.findAndModify(
        {_id: name},
        [],
        {$inc: {value: 1}},
        {
            new: true,
            upsert: true
        },
        function(error, object){
            if( error ) return callback( error );
            if (!object) return callback(new Error('Failed to retrieve object'));
            return callback(null, object.value);
        }
    );
});