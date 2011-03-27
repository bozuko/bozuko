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

                return Bozuko.models.Statistic.search(options, function(error, stats) {
                    
                    if( format == 'csv' ){
                        var fields = [
                            'service',
                            'sid',
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
                        stats.forEach(function(stat){
                            if( !stat.get('daily_checkins') ) stat.set('daily_checkins', 0);
                            var line = [];
                            fields.forEach(function(field){
                                var v;
                                if( field == 'link' ){
                                    v = 'https://'+Bozuko.config.server.host
                                        +':'+Bozuko.config.server.port+'/stats/redirect/'
                                        +stat.get('service')+'/'+stat.get('sid')
                                    
                                }
                                else{
                                    v = stat.get(field);
                                }
                                v = v+'';
                                line.push( '"'+(v.replace(/"/g,'\"'))+'"');
                            });
                            res.write(line.join(',')+'\n');
                        });
                        return res.end();
                    }
                    else{
                        if (error) return error.send(res);
                        return res.send(stats);
                    }
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