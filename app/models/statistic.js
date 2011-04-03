var facebook = Bozuko.require('util/facebook'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var Statistic = module.exports = new Schema({
    service          :{type: String},
    name             :{type: String},
    city             :{type: String},
    sid              :{type: String},
    lat              :{type: Number},
    lng              :{type: Number},
    total_checkins   :{type: Number},
    daily_checkins   :{type: Number},
    timestamp        :{type: Date, default: Date.now}
});

Statistic.pre('save', function(next){
    var self = this;
    Bozuko.models.Statistic.find({
        service: self.service,
        sid: self.sid
    }).sort(['timestamp'], -1).limit(1).run(function(error, stats){
        
        if (error) {
            console.log("statistics.pre error = "+error);
            return next(error);
        }
        var stat = stats.length ? stats[0] : null;
        if( stat ){
            // first of all, lets see if this was already collected toda
            var now = self.get('timestamp');
            var old = stat.get('timestamp');
            
            console.log('now', now);
            console.log('old', old);
            
            if( old.getDay() == now.getDay() && old.getFullYear() == now.getFullYear() && old.getMonth() == now.getMonth() ){
                return next( new Error('Statistic for ['+stat.name+'] ('+stat.service+','+stat.sid+') has already been collected') );
            }
            try{
                self.daily_checkins =  Math.max(0, self.total_checkins - stat.total_checkins);
            }catch(e){
                print("daily checkins set to 0");
                self.daily_checkins =  0;
            }
        }
        else{
            self.daily_checkins = 0;
        }
        return next();
    });
});

Statistic.static('search', function(options, callback){
    var service = options.service || Bozuko.config.defaultService;
    var limit = options.limit || 365;

    var fn = function(err, stats){
        callback(err, stats);
    };

    if (options.city) {
        Bozuko.models.Statistic.find({'service': service, 'city': options.city}, fn);
    } else if (options.latLng) {
        Bozuko.models.Statistic.find({'service': service,'lat':options.latLng.lat,
            'lng':options.latLng.lng}, fn);
    } else {
        Bozuko.models.Statistic.find({}, fn);
    }
});
