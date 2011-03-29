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
    Bozuko.models.Statistic.findOne({
        service: this.service,
        sid: this.sid
    }, function(error, stat){
        if( stat ){
            // first of all, lets see if this was already collected toda
            var now = self.get('timestamp');
            var old = stat.get('timestamp');
            if( old.getDay() == now.getDay() && old.getFullYear() == now.getFullYear() && old.getMonth() == now.getMonth() ){
                return next( new Error('Statistic for ['+stat.name+'] ('+stat.service+','+stat.sid+') has already been collected') );
            }
            try{
                self.set('daily_checkins', self.get('total_checkins') - stat.get('total_checkins'));
            }catch(e){
                self.set('daily_checkins', 0);
            }
        }
        else{
            self.set('daily_checkins', 0);
        }
        return next();
    }).sort({timestamp:-1});
});

Statistic.static('search', function(options, callback){
    var service = options.service || Bozuko.config.defaultService;
    var limit = options.limit || 365;

    var fn = function(err, stats){
        callback(err, stats);
    };

    if (options.city) {
        console.log("options.city = "+options.city);
        Bozuko.models.Statistic.find({'service': service, 'city': options.city}, fn);
    } else if (options.latLng) {
        Bozuko.models.Statistic.find({'service': service,'lat':options.latLng.lat,
            'lng':options.latLng.lng}, fn);
    } else {
        Bozuko.models.Statistic.find({}, fn);
    }
});
