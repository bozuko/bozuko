var bozuko = require('bozuko');

var requestCount = 0;

exports.transfer_objects = {
    page: {

        doc: "A Bozuko Page",

        def: {
            id: "Number",
            name: "String",
            picture: "String",
            facebook_page: "String",
            category: "String",
            website: "String",
            location: {
                street: "String",
                city: "String",
                state: "String",
                country: "String",
                zip: "String",
                latitude: "String",
                longitude: "String"
            },
            phone: "String",
            fan_count: "String",
            checkins: "Number",
            info: "String",
            games: [{
                id: "Number",
                name: "String",
                icon: "String",
                description: "String",
                prize: "String"
            }],
            links: {
                contest: "String",
                facebook_login: "String",
                facebook_checkin: "String",
                contest_result: "String",
                share: "String",
                feedback: "String"
            }
        }
    },

    share_form: {

        doc : "The form to share a Bozuko Page with someone via email or facebook",

        def: {
            facebook_friends: ["String"],
            email_contacts: ["String"],
            message: "String",
            links: {
                facebook_login: "String"
            }
        }
    },

    feedback_form: {

        doc: "Feedback form",

        def: {
            message: "String"
        }
    }
};

exports.links = {
    pages: {
        get: {
            doc: "Return a list of pages",

            params: {
                lat: {
                    required: true,
                    type: "Number",
                    description: 'Center Latitude'
                },
                lng: {
                    required: true,
                    type: "Number",
                    description: 'Center Longitude'
                },
                query: {
                    type:"String",
                    description: "A string to search for"
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

            returns: ["page"]

        }
    },

    page: {
        get: {
            doc: "Return a specific page",
            returns: "page"
        }
    },

    share: {
        put: {
            doc: "Share this page with a friend",
            body: {
                required: true,
                type: "share_form"
            }
        }
    },

    feedback: {
        put: {
            doc: "Send feedback to Bozuko and the Page owner",
            body: {
                required: true,
                type: "feedback_form"
            }
        }
    }
};

var fakeGames = [];

exports.routes = {

    '/pages': {

        aliases: ['/places'],

        get: {

            handler: function(req,res) {
                var lat = req.param('lat') || '42.645625';
                var lng = req.param('lng') || '-71.307864';

                var options = {
                    latLng: {lat:lat, lng:lng},
                    limit: parseInt(req.param('limit')) || 25,
                    offset: parseInt(req.param('offset')) || 0
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
    '/page/:id': {

        get: {
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
    },

    '/page/facebook/:id': {

        put: {
            handler: function(req, res) {
                id = req.param('id');
                if(!req.session.user || !req.session.user.can_manage_pages ) {
                    res.statusCode = 401;
                    res.end();
                    return;
                }

                facebook.graph('/'+id, {user: req.session.user}, function(data) {
                    if (!data) {
                        res.statusCode = 404;
                        res.end();
                        return;
                    }
                    bozuko.models.Page.findOne({'services.name':'facebook','services.id':id}, function(err, page){
                        if (err) {
                            res.StatusCode = 500;
                            console.log("page findOne error: "+JSON.stringify(err));
                            var error = bozuko.transfer('error', {
                                name: "page findOne",
                                msg: "DB error on page findOne"
                            });
                            res.send(error);
                        }

                        if (page && page.owner_id != req.session.user._id) {
                            res.statusCode = 401;
                            res.end();
                            return;
                        }
                        if (!page) page = new bozuko.models.Page();
                        page.service('facebook', data.id, req.session.user.service('facebook').auth, data);

                        page.name = data.name;
                        page.games = [];

                        page.is_location = data.location && data.location.latitude ? true : false;
                        if( page.is_location ){
                            page.lat = parseFloat(data.location.latitude);
                            page.lng = parseFloat(data.location.longitude);
                        }
                        page.owner_id = req.session.user._id;
                        page.save(function(err){
                            if (err) {
                                res.StatusCode = 500;
                                console.log("page save error: "+JSON.stringify(err));
                                var error = bozuko.transfer('error', {
                                    name: "page save",
                                    msg: "DB error on page save"
                                });
                                res.send(error);
                            }
                            res.end();
                        });
                    });
                });
            }
        }
    }
};