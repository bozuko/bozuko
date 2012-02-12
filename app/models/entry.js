var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId,
    Profiler = Bozuko.require('util/profiler')
;

var Entry = module.exports = new Schema({
    contest_id              :{type:ObjectId,    index: true},
    page_id                 :{type:ObjectId,    index: true},
    user_id                 :{type:ObjectId,    index: true},
    /* page and user names for searching */
    user_name               :{type:String},
    page_name               :{type:String},
    type                    :{type:String},
    action_id               :{type:ObjectId},
    timestamp               :{type:Date,        default: Date.now, index: true},
    wall_posts              :{type:Number,      default: 0},
    tokens                  :{type:Number},
    initial_tokens          :{type:Number}
}, {safe: {j:true}});

Entry.static('getUserInfo', function(contest_id, user_id, callback) {

    var min_expiry_date = new Date(new Date().getTime() - Bozuko.config.entry.token_expiration);
    Bozuko.models.Entry.find(
        {contest_id: contest_id, user_id: user_id, timestamp: {$gt :min_expiry_date}},
        function(err, entries) {
            if (err) return callback(err);
            var tokens = 0;
            var last_entry = null;
            var earliest_active_entry_time = null;

            var prof = new Profiler('/models/entry/getUserInfo');

            entries.forEach(function(entry) {
                if (!earliest_active_entry_time || (entry.timestamp < earliest_active_entry_time)) {
                    earliest_active_entry_time = entry.timestamp;
                }
                tokens += entry.tokens;
            });
            
            return Bozuko.models.Entry.find(
                {contest_id: contest_id, user_id: user_id},
                {},
                {limit:1, sort:{timestamp:-1}},
                function(error, last_entries){
                    
                    if( error ) return callback(error);
                    
                    if( last_entries && last_entries.length ){
                        last_entry = last_entries[0];
                    }
                    
                    prof.stop();

                    return callback(null, {
                        tokens: tokens,
                        last_entry: last_entry,
                        earliest_active_entry_time: earliest_active_entry_time
                    });
                }
            );
                

            
        }
    );

});

