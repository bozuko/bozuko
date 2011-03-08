var bozuko = require('bozuko');

var qs       = require('querystring');

var requestCount = 0;

var fakeContests = [{
    id : 'coinflip90132',
    name: 'coinflip',
    icon : '/images/games/goldEagleHeads60x60.png',
    description : 'Flip a coin',
    prize : 'Free Buffalo Wings and Potato Skins!'
}];

exports.doc = {
    description : ""
};

exports.routes = {

    '/pages' : {

        aliases : ['/places'],

        get : {

            doc: {
                description: 'Get a list of pages generated from facebook',

                params: {
                    lat: {
                        type: "Number",
                        description: 'latitude'
                    },
                    lng: {
                        type: "Number",
                        description: 'longitude'
                    },
                    limit: {
                        type: "Number",
                        description: "The number of search results to return"
                    },
                    offset: {
                        type: "Number",
                        description: "The starting result number"
                    }
                },
                
                returns: {
                    name: "pages",
                    type: "Array",
                    description: "Returns an array of objects"
                }
            },

            handler: function(req,res) {
                var lat = req.param('lat') || '42.645625';
                var lng = req.param('lng') || '-71.307864';

                var options = {
                    latLng : {lat:lat, lng:lng},
                    limit : parseInt(req.param('limit')) || 25,
                    offset : parseInt(req.param('offset')) || 0
                };
                bozuko.models.Page.search(options, function(pages){
                    res.send(pages);
                });
            }
        }
    },


    /**
     * TODO
     *
     * Return Bozuko page results (models/page) instead of straight up facebook.
     * This may require two separate urls in order to serve non-bozuko pages
     * in our list. Or we just add places to our database as we find them
     * via the 3rd party service... I think that might be too much though.
     *
     */
    '/page/:id' : {

        get : {

            doc: {
                description: "Return page details",

                params: {
                    id: {
                        required: true,
                        type: "Number",
                        description: "The id of the page"
                    }
                },

                returns: {
                    name: "data",
                    type: "Object",
                    description: "Page information"
                }
            },

            handler: function(req,res) {
                bozuko.service('facebook').place({
                    place_id:req.param('id')
                },function(error, place){
                    place.contests = fakeContests;
                    res.send(place);
                });
            }
        }
    },

    '/page/:id/checkin' : {

        aliases : ['/place/:id/checkin'],

        post : {

            doc: {
                description: "Checkin to the place",

                params: {
                    id: {
                        required: true,
                        type: "Number",
                        description: "The id of the place to checkin to."
                    },
                    lat: {
                        required: true,
                        type: "Number",
                        description: "User latitude"
                    },
                    lng: {
                        required: true,
                        type: "Number",
                        description: "User longitude"
                    },
                    message : {
                        type: "String",
                        description: "The user message to post with the checkin."
                    }
                },
                returns: {
                    name: "info",
                    type: "Object",
                    description: "Checkin information"
                }
            },

            handler: function(req, res) {
                var page_id = req.param('id');
                var lat = req.param('lat');
                var lng = req.param('lng');

                // we should have the user from the session...
                if( !req.session.user ){
                    res.statusCode = 404,
                    res.end();
                    return;
                }
                // lets check them in...
                bozuko.service('facebook').place({place_id: page_id}, function(error, p){
                    bozuko.service('facebook').checkin({
                        user        :req.session.user,
                        message     :'Just won a free burrito playing bozuko!',
                        place_id    :p.id,
                        actions     :{name:'View on Bozuko', link:'http://bozuko.com'},
                        link        :'http://bozuko.com',
                        picture     :'http://bozuko.com/images/bozuko-chest-check.png',
                        description :'Bozuko is a fun way to get deals at your favorite places. Just play a game for a chance to win big!',
                        latLng      :{lat:p.location.latitude,lng:p.location.longitude}
                    },function(error, result){
                        console.log(error);
                        res.end();
                    });
                });
            }
        }
    }
}