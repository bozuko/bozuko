var async = require('async');

exports.routes = {

    '/stats(\.:format)?': {

        get: {

            // What to use for access here?

            handler: function(req, res) {
                var options = {};

                var format = (req.param('format') || 'html').replace(/^\./,'');

                if( format == 'html'){

                    return res.render('stats',{
                        title:"Checkin Statistics"/*,
                        scripts:[
                            'http://dev.sencha.com/deploy/ext-4.0-pr5/ext-core-sandbox.js',
                            'http://dev.sencha.com/deploy/ext-4.0-pr5/ext-all-sandbox.js',
                            '/js/desktop/stats.js'
                        ],
                        styles:[
                            'http://dev.sencha.com/deploy/ext-4.0-pr5/resources/css/ext-sandbox.css',
                        ]*/
                    });
                }

                if (req.param('city')) options.city = req.param('city');
                if (req.param('lat') && req.param('lng')) {
                    options.latLng = {lat: req.param('lat'), lng: req.param('lng')};
                }
                if (req.param('service')) options.service = req.param('service');

                var sort = {timestamp: -1};

                if( req.param('sort') ){
                    switch(req.param('sort')){
                        case 'service':
                            sort.service = 1;
                            sort.sid = 1;
                    }
                }
                options.sort = sort;
                

                if( format == 'csv') return Bozuko.models.Statistic.collection.find({}, function(error, cursor) {

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
                        'timestamp',
                        'link'
                    ];
                    res.header('content-type','text/csv');
                    res.writeHead(200);
                    var nostat=0;
                    var cstat=0;
                    cursor.each(function(error,stat){
                        
                        if( error ) console.log(error);
                        
                        if( !stat ){
                            // this is the last record.
                            res.end();
                            return;
                        }
                        
                        //console.log('stat '+(++cstat));
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
                        line = line.join(',');
                        //console.log(line);
                        res.write(line+'\n','utf-8');
                    });
                    
                });
                
                return Bozuko.models.Statistic.search(options, function(error, stats){
                    if (error) return error.send(res);
                    return res.send(stats);
                });
            }
            
        }
    },

    'stats/redirect/:service/:id': {
        get : {
            handler : function(req,res){
                var service = req.param('service');
                Bozuko.service(service).place({place_id:req.param('id')}, function(error, place){
                    if( error ){
                        console.log(error);
                        return error.send(res);
                    }
                    if( service == 'foursquare'){
                        return res.redirect(place.data.shortUrl);
                    }
                    else{
                        return res.redirect(place.data.link);
                    }
                });
            }
        }
    }
};