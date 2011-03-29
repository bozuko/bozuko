var async = require('async');

var locations = {
    "MA - Faneuil Hall":[42.360133,-71.055767],
    "MA - Back Bay":[42.34964,-71.082165],
    "MA - Davis Square":[42.396476,-71.122436],
    "MA - Hookslides":[42.645494,-71.307777],
    "NY - Times Square":[40.756433,-73.986418],
    "NY - Greenwich Village":[40.731682,-73.994765],
    "NY - Chelsea":[40.746867,-74.001675],
    "NY - Yankee Stadium":[40.828984,-73.926498],
    "NC - Chapel Hill":[35.913245,-79.05575],
    "NC - Charlotte":[35.226621,-80.84075],
    "FL - Tampa":[27.961201,-82.441235],
    "FL - Disney":[28.371616,-81.550655],
    "FL - Key West":[24.552217,-81.799972],
    "FL - Miami Beach":[25.779914,-80.130672],
    "FL - Ft Lauderdale":[26.122074,-80.137239],
    "FL - FSU":[30.440682,-84.28093],
    "DC - Tourism":[38.887024,-77.017765],
    "DC - Georgetown":[38.905186,-77.06273],
    "RI - Newport":[41.481673,-71.314402],
    "ME - Portland":[43.656361,-70.25318],
    "VT - Burlington":[44.476038,-73.211904],
    "PA - Philly":[39.950576,-75.162642],
    "GA - Atlanta":[33.758572,-84.387521],
    "IL - Chicago - Depaul":[41.878061,-87.627447],
    "IL - Chicago - Northwestern":[41.891736,-87.624679],
    "IL - Chicago - Wrigleyville":[41.947953,-87.655524],
    "IN - Purdue":[40.4232,-86.906962],
    "MI - Ann Arbor":[42.280484,-83.748409],
    "MI - Detroit":[42.334644,-83.043594],
    "TN - Nashville":[36.160919,-86.777176],
    "TN - Memphis":[35.139485,-90.050125],
    "LA - New Orleans":[29.958588,-90.065628],
    "TX - Austin":[30.267648,-97.741177],
    "TX - Dallas":[32.79817,-96.802597],
    "AZ - Tucson":[32.226108,-110.965508],
    "AZ - Tempe":[33.425532,-111.940298],
    "CO - Denver":[39.747817,-104.999192],
    "CO - Boulder":[40.016178,-105.276489],
    "UT - Salt Lake":[40.761821,-111.873779],
    "NE - Omaha":[41.238577,-95.921631],
    "ND - Fargo":[46.856435,-96.797791],
    "ID - Boise":[46.856435,-96.797791],
    "NV - Vegas":[36.10782,-115.172338],
    "NV - UNLV":[36.108444,-115.13586],
    "NV - Reno":[39.525362,-119.815607],
    "CA - SD":[32.712164,-117.160263],
    "CA - LA - Downtown":[34.046935,-118.255892],
    "CA - LA - W Hollywood":[34.090199,-118.384509],
    "CA - LA - Beverly Hills":[34.075875,-118.376398],
    "CA - LA - USC":[34.021791,-118.292799],
    "CA - SF - Mission":[37.76013,-122.416878],
    "CA - SF - Union square":[37.788556,-122.406921],
    "CA - SF - Haight":[37.770104,-122.446876],
    "CA - Palo Alto":[37.445255,-122.160845],
    "OR - Portland":[45.523758,-122.672782],
    "WA - Seattle 1":[47.608651,-122.339845],
    "WA - Seattle 2":[47.614467,-122.317314],
    "TX - Texas A M":[30.622181,-96.344004],
    "OH - OSU":[40.007237,-83.008146],
    "MN - Minneapolis":[44.97846,-93.273582],
    "WI - Madison":[43.073214,-89.394808],
    "OK - OK City":[35.467032,-97.508383],
    "Canada - Vancouver":[49.282644,-123.116484],
    "Canada - Calgary":[51.045603,-114.06538],
    "Canada - Montreal":[45.497684,-73.575954]
};

var collect = exports.collect = function(service, city, latLng, callback) {
    Bozuko.service(service).search({latLng: latLng, limit: 50}, function(err, results) {
        if (err) {
            console.log(service+" search error: latLng = "+JSON.stringify(latLng)+", error = "+err);
            return callback(err);
        }

        if (results) {
            var counters = {
                stats: 0,
                errors: 0
            };
            console.log(service+' got '+results.length+' results for '+city);
            return async.forEach(results,
                function(page, cb) {
                    var s = new Bozuko.models.Statistic();
                    s.service = service;
                    s.name = page.name;
                    s.city = city;
                    s.sid = page.id;
                    s.lat = latLng.lat;
                    s.lng = latLng.lng;
                    s.total_checkins = page.checkins;
                    s.timestamp = new Date();
                    s.save(function(err) {
                        if (err){
                            counters.errors++;
                            console.log(err);
                        } else {
                            counters.stats++;
                        }
                        return cb();
                    });
                },
                function(err) {
                    if (err) return callback(err);
                    return callback(null, counters);
                }
            );
        } else {
            return callback(Bozuko.error('stats/collect_no_results'));
        }
    });
};

exports.collect_all = function(callback) {
    var fns = [];
    var errors = 0;
    var stats = 0;
    Object.keys(locations).forEach(function(city) {
        var latLng = {
            lat: locations[city][0],
            lng: locations[city][1]
        };
        ['facebook','foursquare'].forEach(function(service){
            fns.push(function(callback){
                collect(service, city, latLng, function(error, counters){
                    if( error ){
                        errors += 1;
                        return callback(null, 'error');
                    }
                    errors += counters.errors;
                    stats += counters.stats;
                    return callback(null, 'ok');
                });
            });
        });
    });

    async.series(fns, function(err, results){
        console.log('Collect All ran - found '+errors+' errors, '+stats+' places');
    });

};