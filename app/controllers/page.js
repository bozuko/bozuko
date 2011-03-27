var async = require('async');

var requestCount = 0;

exports.transfer_objects = {
    
    page: {

        doc: "A Bozuko Page",

        def: {
            id: "String",
            name: "String",
            image: "String",
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
            // see the definition in the contest controller
            games: ["game"],
            links: {
                facebook_login: "String",
                facebook_checkin: "String",
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

var fill_page = function(p, callback) {
    p.getContests(function(contests) {
        // Return everything with a facebook format for now
        var page = p.service('facebook').data;
        var page_path = "/page/"+p._id;
        page.links = {};

        // Just use first contest for now
        if (contests.length > 0) {
            page.games = contests[0].games;
            var contest_id = contests[0]._id;
            page.links.contest = "/contest/"+contest_id;
            page.links.contest_result = "/contests/"+contest_id+"/result";
        }
        page.links.facebook_checkin = "/facebook/"+page.id+"/checkin";
        page.links.facebook_like = "/facebook/"+page.id+"/like";
        page.links.facebook_login = "/facebook/login";
        page.links.share = page_path+"/share";
        page.links.feedback = page_path+"/feedback";
        callback(null, page);
    });
};

function get_page_links(page, fid){
    var links = {
        facebook_page       :'http://facebook.com/'+fid,
        facebook_login      :'/user/login/facebook',
        facebook_checkin    :'/facebook/'+fid+'/checkin',
        facebook_like       :'/facebook/'+fid+'/like'
    };
    if( page ){
        links.page          ='/page/'+page.id,
        links.share         ='/page/'+page.id+'/share';
        links.feedback      ='/page/'+page.id+'/feedback';
    }
    return links;
}

exports.routes = {

    '/pages': {

        aliases: ['/pages/:service?', '/places/:service?', '/places'],

        get: {

            handler: function(req,res) {
                var lat = req.param('lat') || '42.645625';
                var lng = req.param('lng') || '-71.307864';
                var service = req.param('service');
                var query = req.param('q');

                var options = {
                    latLng: {lat:lat, lng:lng},
                    limit: parseInt(req.param('limit')) || 25,
                    offset: parseInt(req.param('offset')) || 0
                };
                
                if( query ) options.query = query;
                if( service ) options.service = service;
                
                Bozuko.models.Page.search(options,
                    function(error, results){
                        if( error ){
                            error.send(res);
                        }
                        
                        var ret=[];
                        if( results.pages ) results.pages.forEach(function(p){
                            var page = Bozuko.sanitize('page', p);
                            page.links = get_page_links(page, p.service('facebook').sid);
                            if( p.contests ){
                                p.contests.forEach(function(contest){
                                    // build games
                                });
                            }
                            ret.push(page);
                        });
                        
                        if( results.service_results ) results.service_results.forEach(function(r){
                            var fid = r.id;
                            delete r.id;
                            var result = Bozuko.sanitize('page', r);
                            if( r.service == 'facebook' ){
                                result.links = get_page_links(null, fid);
                            }
                            ret.push(Bozuko.sanitize('page',result));
                        });
                        
                        ret.forEach( function(p){
                            p = Bozuko.transfer('page', p);
                        });
                        
                        res.send(ret);
                    }
                );
            }
        }
    },


    '/page/:id': {

        get: {
            handler: function(req,res) {
                var page_id = req.param('id');
                Bozuko.models.Page.findOne({_id: page_id}, function(err, p) {
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
                    fill_page(p, function(err, page) { res.send(page); });
                });
            }
        }
    }
};
