var bozuko = require('bozuko'),
    facebook = bozuko.require('util/facebook'),
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
    daily_checkin    :{type: Number},
    timestamp        :{type: Date}
});

Statistic.static('search', function(options, callback){
    var service = options.service || bozuko.config.defaultService;
    var limit = options.limit || 365;

    var fn = function(err, stats){
        callback(err, stats);
    };

    if (options.city) {
        console.log("options.city = "+options.city);
        bozuko.models.Statistic.find({'service': service, 'city': options.city}, fn);
    } else if (options.latLng) {
        bozuko.models.Statistic.find({'service': service,'lat':options.latLng.lat,
            'lng':options.latLng.lng}, fn);
    } else {
        bozuko.models.Statistic.find({}, fn);
    }
});
