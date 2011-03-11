var bozuko = require('bozuko');

var requestCount = 0;

var fakeGames = [{
    id : '90132',
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
                        required: true,
                        type: "Number",
                        description: 'latitude'
                    },
                    lng: {
                        required: true,
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
                    description: "Returns an array of pages."
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
                    description: "Page information",

                    example: {
                        id: 123456,
                        name: 'Hookslide Kelly\'s',
                        picture: 'http://graph.facebook.com/picture/35235235',
                        link: 'http://facebook.com/pages/Hookslides/3525252323',
                        category: 'Local business',
                        website: 'www.hookslidekellys.com',
                        location: {
                            street: '19 Merrimack Street',
                            city: 'Lowell',
                            state: 'MA',
                            country: 'United States',
                            zip: '01852',
                            latitude: 42.3,
                            longitude: -71.105
                        },
                        phone: '978-654-4225',
                        fan_count: 1000,
                        checkins: 80000,
                        games: fakeGames,
                        links: {
                            contest: '/contest/4553453',
                            checkin: '/contest/4553453/entry/facebook/checkin?lat=42.3&lng=-71.105&page_id=123456',
                            result: '/contest/4553453/result'
                        }
                    }
                }
            },

            handler: function(req,res) {
                page_id = req.param('id');
                bozuko.service('facebook').place({
                    place_id: page_id
                },function(error, place){
                    place.games = fakeGames;
                    place.links = {
                        contest: '/contest/4553453',
                        checkin: "/contest/4553453/entry/facebook/checkin?lat=42.3&lng=-71.105&page_id="+page_id,
                        result: '/contest/4553453/result'
                    };
                    res.send(place);
                });
            }
        }
    }
};