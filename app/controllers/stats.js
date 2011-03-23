var bozuko = require('bozuko'),
    async = require('async');

exports.routes = {

    '/stats': {

        get: {

            // What to use for access here?

            handler: function(req, res) {
                var options = {};

                if (req.param('city')) options.city = req.param('city');
                if (req.param('lat') && req.param('lng')) {
                    options.latLng = {lat: req.param('lat'), lng: req.param('lng')};
                }
                if (req.param('service')) options.service = req.param('service');

                bozuko.models.Statistic.search(options, function(error, stats) {
                    if (error) return error.send(res);
                    res.send(stats);
                });
            }
        }
    }
};