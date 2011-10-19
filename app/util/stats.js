var async = require('async'),
    mail = Bozuko.require('util/mail'),
    XRegExp = Bozuko.require('util/xregexp')
    ;

var locations = exports.locations = {
    "MA - Fenway":[42.345826,-71.098365],
    "MA - Back Bay-2":[42.353406,-71.072659],
    "MA - Park Area":[42.351789,-71.068583],
    "MA - Fleet Center":[42.364284,-71.059849],
    "MA - Kendall":[42.362341,-71.086103],
    "MA - Union Sq":[42.379756,-71.096349],
    "MA - Porter Sq":[42.390905,-71.122578],
    "MA - Harvard":[42.373336,-71.119266],
    "MA - Coolidge":[42.342305,-71.121347],
    "MA - Marina Bay":[42.296612,-71.02644],
    "MA - Lexington":[42.448478,-71.229193],
    "MA - Westford":[42.568909,-71.420521],
    "MA - Nashua":[42.764735,-71.464701],
    "MA - Worcester":[42.265397,-71.802101],
    "MA - Falmouth":[41.552195,-70.616302],
    "MA - Waterfront":[42.350808,-71.042967],
    "MA - Newburyport":[42.813875,-70.873677],
    "MA - Fresh Pond":[42.388209,-71.142688],
    "MA - Drum Hill":[42.623466,-71.364005],
    "MA - Pheasant Lane Mall":[42.701859,-71.440527],
    "MA - Burlington Mall":[42.48183,-71.215074],
    "MA - Natick":[42.305607,-71.397703],
    "MA - Lowell Spinners":[42.653792,-71.316559],
    "MA - North Shore Mall":[42.541445,-70.941811],
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

var collect = exports.collect = function(service, city, center, callback) {
    Bozuko.service(service).search({center: center, limit: 50}, function(err, results) {
        if (err) {
            console.log(service+" search error: latLng = "+JSON.stringify(center)+", error = "+err);
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
                    s.lat = page.location.lat;
                    s.lng = page.location.lng;
                    s.total_checkins = page.checkins;
                    s.timestamp = new Date();
                    // collect the category
                    s.category = page.category;
                    
                    var save = function(){
                        s.save(function(err) {
                            if (err){
                                counters.errors++;
                                console.log(err);
                            } else {
                                counters.stats++;
                            }
                            return cb();
                        });;
                    };
                    
                    if( service !== 'facebook' ) return save();
                    // else, lets try to get the email address
                    
                    return Bozuko.require('util/http').request({
                        url: page.data.link+'?sk=info',
                        headers:{
                            'user-agent':'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/535.2 (KHTML, like Gecko) Chrome/15.0.874.92 Safari/535.2',
                            'accept':'text/html',
                            'accept-charset':'utf-8'
                        }
                    }, function(e, response){
                        if( e ) return save();
                        var start = 'Email\\u003c\\/th>\\u003ctd class=\\"data\\">\\u003cdiv class=\\"data_field\\">',
                            startIndex = response.indexOf(start),
                            email = '',
                            endIndex = response.indexOf('\\u003c\\/div>', startIndex+start.length);
                        
                        if( ~startIndex && startIndex < endIndex ){
                            email = response.substring(startIndex+start.length, endIndex).replace('&#64;', '@');
                        }
                        s.email = email;
                        return save();
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

    mail.send({
        to      :"info@bozuko.com",
        subject :"Bozuko Stat Collection Starting",
        body    :["Yo-",
                  "",
                  "FYI - The statistic collection process just started, I'll send an email when its finished.",
                  "If you do not receive the follow up email, there may be a problem.",
                  "",
                  "-Bozuko"].join('\n')
    },
    function(error, success){
        if( error || !success ){
            console.log("Error sending mail");
        }
    });

    Object.keys(locations).forEach(function(city) {
        var center = locations[city].slice(0);
        center.reverse();

        ['facebook','foursquare'].forEach(function(service){
            fns.push(function(callback){
                collect(service, city, center, function(error, counters){
                    if( error ){
                        errors += 1;
                        return callback(null, 'error');
                    }
                    errors += counters.errors;
                    stats += counters.stats;
                    // buffer for 4s
                    return setTimeout( function(){ callback(null, 'ok') }, 200 );
                });
            });
        });
    });
    async.series(fns, function(err, results){
        console.log('Collect All ran - found '+errors+' errors, '+stats+' places');
        // lets create a csv buffer
        var d = new Date();
        d.setHours(0);
        d.setMinutes(0);
        d.setSeconds(0);

        Bozuko.models.Statistic.find({timestamp:{$gt:d}}, function(error, statistics){

            if( error ){
                return console.log(error);
            }
            var fields = [
                'service',
                'sid',
                'category',
                'name',
                'city',
                'lat',
                'lng',
                'total_checkins',
                'daily_checkins',
                'email',
                'timestamp',
                'link'
            ];
            var lines = [];
            statistics.forEach(function(stat){
                if( !stat ) return;

                if( !stat.daily_checkins ) stat.daily_checkins = 0;
                var line = [];
                fields.forEach(function(field){
                    var v;
                    if( field == 'link' ){
                        v = 'https://'+Bozuko.config.server.host
                            +':'+Bozuko.config.server.port+'/stats/redirect/'
                            +stat.service+'/'+stat.sid;
                    }
                    else{
                        v = stat[field];
                    }
                    v = v+'';
                    line.push( '"'+(v.replace(/"/g,'\"'))+'"');
                });
                lines.push(line);
            });

            var csv = {
                filename: "Bozuko_Stats_"+(d.getMonth()+1)+'-'+(d.getDate())+'-'+d.getFullYear()+'.csv',
                contents: new Buffer(lines.join('\n'),'utf-8')
            };

            return mail.send({
                to      :"info@bozuko.com",
                subject :"Bozuko Stat Collection Finished",
                body    :["Looking good-",
                          "",
                          "The stats collection finished. Here is a quick overview:",
                          "We collected stats for "+stats+" places.",
                          "There were "+errors+" errors during collection",
                          "",
                          "",
                          "",
                          "-Bozuko"].join('\n'),
                attachments: [csv]
            },
            function(error, success){
                if( error || !success ){
                    console.log("Error sending mail");
                }
            });

        });
    });

};