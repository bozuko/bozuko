var async = require('async'),
    Profiler = Bozuko.require('util/profiler');

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
            featured: "Boolean",
            favorite: "Boolean",
            registered: "Boolean",
            announcement: "String",
            distance: "String",
            location: {
                street: "String",
                city: "String",
                state: "String",
                country: "String",
                zip: "String",
                lat: "Number",
                lng: "Number"
            },
            
            phone: "String",
            fan_count: "Number",
            checkins: "Number",
            info: "String",
            games: ["game"],
            links: {
                facebook_login: "String",
                facebook_checkin: "String",
                facebook_like: "String",
                feedback: "String",
                favorite: "String",
                page: "String"
            }
        },
        
        create: function(page){
            // this should hopefully be a Page model object
            // lets check for a contest
            var fid = page.registered ? page.service('facebook').sid : page.id;
            if( !page.registered ) delete page.id;
            page.links = {
                facebook_page       :'http://facebook.com/'+fid,
                facebook_login      :'/user/login/facebook',
                facebook_checkin    :'/facebook/'+fid+'/checkin',
                facebook_like       :'/facebook/'+fid+'/like'
            };
            if( page.registered ){
                
                // add registered links...
                page.links.page          ='/page/'+page.id,
                page.links.share         ='/page/'+page.id+'/share';
                page.links.feedback      ='/page/'+page.id+'/feedback';
                page.links.favorite      ='/user/favorite/'+page.id;
            }
            var games = [];
            
            if( page.contests ) page.contests.forEach(function(contest){
                games.push( contest.getGame() );
            });
            return this.sanitize(page);
        }
    },
    
    pages : {
        doc: "List of pages",
        def:{
            "pages" : ['page'],
            "next" : "String"
        }
    }
};

exports.links = {
    pages: {
        get: {
            doc: "Return a list of pages. The center (user) latitude is always required.",

            params: {
                ll : {
                    required: true,
                    type: "String",
                    description: 'The user\'s latitude / longitude separated by a comma (example 42.1234121,-71.2423423). This is always required.'
                },
                bounds : {
                    type: "String",
                    description: 'The bounding geographic box to search within. '+
                                 'This should be passed as 2 points - the bottom left (p1) and top right (p2). '+
                                 'Each points should be passed the same as the ll parameter and also separated by a comma. '+
                                 'An example, where p1=lat1,lng1 and p2=lat2,lng2 would be passed as lat1,lng1,lat2,lng2'
                },
                favorites: {
                    type: "Boolean",
                    description: 'Pass this parameter as true to get a list of user favorites. '
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

            returns: "pages"

        }
    },

    page: {
        get: {
            doc: "Return a specific page",
            returns: "page"
        }
    },

    feedback: {
        put: {
            access: 'user',
            doc: "Send feedback to Bozuko and the Page owner",
            params: {
                message:{
                    required: true,
                    type: "String",
                    description: "The message to send to the Business / Bozuko"
                }
            }
        }
    }
};

var fill_page = function(p, callback) {
    p.getContests(function(error, contests) {
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
                var ll = req.param('ll');
                var bounds = req.param('bounds');
                var service = req.param('service');
                var query = req.param('query');
                var favorites = req.param('favorites');
                
                if( !ll) return Bozuko.error('page/pages_no_ll').send(res);
                
                var options = {
                    limit: parseInt(req.param('limit')) || 25,
                    offset: parseInt(req.param('offset')) || 0,
                    user: req.session.user
                };
                
                // first, we will try center
                if( ll ){
                    
                    var parts = ll.split(',');
                    if( parts.length != 2 ){
                        Bozuko.error('page/malformed_center').send(res);
                    }
                    var lat = parseFloat(parts[0]);
                    var lng = parseFloat(parts[1]);
                    options.ll = [lng,lat];
                }
                // lets also look for bounds
                if(bounds){
                    var parts = bounds.split(',');
                    if( parts.length != 4 ){
                        Bozuko.error('page/malformed_bounds').send(res);
                    }
                    var lat1 = parseFloat(parts[0]);
                    var lng1 = parseFloat(parts[1]);
                    var lat2 = parseFloat(parts[2]);
                    var lng2 = parseFloat(parts[3]);
                    options.bounds = [
                        [lng1,lat1],
                        [lng2,lat2]
                    ];
                }
                
                if( query ) options.query = query;
                if( service ) options.service = service;
                if( favorites ) options.favorites = true;
                var profiler = Profiler.create('Page::search');
                return Bozuko.models.Page.search(options,
                    function(error, pages){
                        if( error ){
                            console.log(error);
                            return error.send(res);
                        }
                        var searchEnd = new Date();
                        profiler.mark('search time');
                        return res.send(Bozuko.transfer('page',pages));
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
    },
    
    'page/:id/image': {
        
        get : {
            handler : function(req,res){
                Bozuko.models.Page.findById(req.param('id'), function(error, page) {
                    if( error ) return error.send(res);
                    return res.redirect( page.image );
                });
            }
        }
        
    }
};
