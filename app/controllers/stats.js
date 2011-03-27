var async = require('async');

exports.routes = {

    '/stats(\.:format)?': {

        get: {

            // What to use for access here?

            handler: function(req, res) {
                var options = {};
                
                var format = (req.param('format') || 'json').replace(/^\./,'');

                if (req.param('city')) options.city = req.param('city');
                if (req.param('lat') && req.param('lng')) {
                    options.latLng = {lat: req.param('lat'), lng: req.param('lng')};
                }
                if (req.param('service')) options.service = req.param('service');

                Bozuko.models.Statistic.search(options, function(error, stats) {
                    
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
                            'timestamp'
                        ];
                        res.header('content-type','text/csv');
                        stats.forEach(function(stat){
                            if( !stat.get('daily_checkins') ) stat.set('daily_checkins', 0);
                            var line = [];
                            fields.forEach(function(field){
                                line.push( '"'+(stat.get(field)+''.replace(/"/g,'\"'))+'"');
                            });
                            res.write(line.join(',')+'\n');
                        }).sort({timestamp:1});
                        return res.end();
                    }
                    else{
                        if (error) return error.send(res);
                        return res.send(stats);
                    }
                });
            }
        }
    }
};