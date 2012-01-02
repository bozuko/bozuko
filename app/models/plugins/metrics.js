var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId
;

var Metrics = module.exports = function(schema, options){

    // Add all schema properties here, so we don't have to do it for each Metrics Model.
    schema.add({
        timestamp: {type: Date, index: true},
        contest_id: {type: ObjectId, index: true},
        page_id: {type: ObjectId, index: true},
        entries: {},
        plays: {},
        wins: {},
        redemptions: {},
        win_cost: {},
        redemption_cost: {},
        fb_posts: {},
        fb_likes: {},
        fb_checkins: {},
        unique_users: {},
        new_users: {}
    });
    
    schema.static('updateMetrics', function(field, value) {
        var self = this;
        var date = new Date();
        var modifier = {$inc: {}};
        modifier.$inc[field+'.ct'] = 1;
        if (value) modifier.$inc[field+'.sum'] = value;
        
        var timestamp;
        switch(this.modelName) {
            case 'MetricsDaily':
                timestamp =  new Date(date.getFullYear(), date.getMonth(), date.getDate());
                break;
            case 'MetricsHourly':
                timestamp = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 
                    date.getHours());
                break;
            case 'MetricsMinutely':     
                timestamp = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 
                    date.getHours(), date.getMinutes());
                break;
        }

        return this.update(
            {timestamp: timestamp},
            modifier,
            {upsert: true},
            function(err) {
                if (err) console.error('Failed to update metrics for '+this.modelName+': '+err);
            }
        );
    });

    schema.static('findMetrics', function(options, callback) {
        return this.find({timestamp: {$gt: options.start, $lt: options.end}}, callback); 
    });
};
