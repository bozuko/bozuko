var bozuko = require('bozuko');

exports.routes = {

    '/facebook/:id/checkin': {
        post: {
            access: 'user',

            handler: function(req, res) {

                var id = req.param('id');
                var lat = req.param('lat');
                var lng = req.param('lng');
                var msg = req.param('message') || '';

                if( !lat || !lng ){
                    res.send({
                        name: "missing parameters",
                        msg: "No Latitude / Longitude"
                    }, 400);
                    return;
                }

                bozuko.service('facebook').checkin({
                    test: true,
                    user: req.session.user._id,
                    message: msg,
                    place_id: id,
                    link        :'http://bozuko.com',
                    picture     :'http://bozuko.com/images/bozuko-chest-check.png',
                    description :'Bozuko is a fun way to get deals at your favorite places. Just play a game for a chance to win big!',
                    latLng: {
                        lat: lat,
                        lng:lng
                    }
                },
                function(error, result){
                    if (error) {
                        res.statusCode = 500;
                        res.end();
                        return;
                    }
                    // TODO: send a real facebook_checkin_result and save this in the db
                    res.send({
                        links: {
                            facebook_like: '/facebook/'+id+"/like"
                        }
                    });

                });

            }
        }
    }
};