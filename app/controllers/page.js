var bozuko = require('bozuko'),
    async = require('async');

var requestCount = 0;

exports.transfer_objects = {
    page: {

        doc: "A Bozuko Page",

        def: {
            id: "String",
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
                latitude: "Number",
                longitude: "Number"
            },
            phone: "String",
            fan_count: "Number",
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

                bozuko.models.Page.search(options, function(error, pages){
                    if( error ){
                        return res.send( bozuko.transfer('error',{name:error.message}), 404);
                    }
                    async.map(pages.bozuko_pages, function(p, callback) {
                        p.getContests(function(contests) {
                            // Return everything with a facebook format for now
                            var page = p.service('facebook').data;
                            var page_path = "/page/"+p._id;

                            // Just use first contest for now
                            if (contests.length > 0) {
                                page.games = contests[0].games;
                                var contest_id = contests[0]._id;
                                page.links = {
                                    contest: "/contest/"+contest_id,
                                    facebook_checkin: "/contest/"+contest_id+"/entry/facebook/checkin",
                                    facebook_like:  "/contest/"+contest_id+"/entry/facebook/like",
                                    facebook_login: "/facebook/login",
                                    contest_result: "/contests/"+contest_id+"/result",
                                    share: page_path+"/share",
                                    feedback: page_path+"/feedback"
                                };
                            } else {
                                page.links = {
                                    facebook_checkin: page_path+"/facebook/checkin",
                                    facebook_like: page_path+"/facebook/like",
                                    facebook_login: "/facebook/login",
                                    share: page_path+"/share",
                                    feedback: page_path+"/feedback"
                                };
                            }
                            callback(null, page);
                        });
                    },
                    function(err, results) {
                        if (!err) {
                            pages.facebook_pages.forEach(function(page) {
                                page.links = {
                                    facebook_checkin: "/facebook/"+page.id+"/checkin",
                                    facebook_like: "/facebook/"+page.id+"/like",
                                    facebook_login: "/facebook/login"
                                };
                            });
                            res.send(results.concat(pages.facebook_pages));
                        } else {
                            res.statusCode(500);
                            res.end();
                        }
                    });
                });
            }
        }
    },


    '/page/:id': {

        get: {
            handler: function(req,res) {
                page_id = req.param('id');
                bozuko.models.Page.findOne({_id: page_id}, function(err, p) {
                    if (err) {
                        res.statusCode = 500;
                        res.end();
                        return;
                    }

                    if (!p) {
                        res.statusCode = 404;
                        res.end();
                        return;
                    };

                    var page = p.service('facebook').data;
                    p.getContests(function(contests) {
                        // Return everything with a facebook format for now
                        var page_path = "/page/"+p._id;

                        // Just use first contest for now
                        if (contests.length > 0) {
                            page.games = contests[0].games;
                            var contest_id = contests[0]._id;
                            page.links = {
                                contest: "/contest/"+contest_id,
                                facebook_checkin: "/contest/"+contest_id+"/entry/facebook/checkin",
                                facebook_like:  "/contest/"+contest_id+"/entry/facebook/like",
                                facebook_login: "/facebook/login",
                                contest_result: "/contests/"+contest_id+"/result",
                                share: page_path+"/share",
                                feedback: page_path+"/feedback"
                            };
                        } else {
                            page.links = {
                                facebook_checkin: page_path+"/facebook/checkin",
                                facebook_like: page_path+"/facebook/like",
                                facebook_login: "/facebook/login",
                                share: page_path+"/share",
                                feedback: page_path+"/feedback"
                            };
                        }
                    });
                    res.send(page);
                });
            }
        }
    }
};