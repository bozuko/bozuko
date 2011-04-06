var async = require('async'),
    Profiler = Bozuko.require('util/profiler');

var requestCount = 0;

exports.transfer_objects = {
    
    page: {

        doc: "A Bozuko Page",

        def: {
            name: "String",
            image: "String",
            facebook_page: "String",
            category: "String",
            website: "String",
            featured: "Boolean",
            favorite: "Boolean",
            registered: "Boolean",
            announcement: "String",
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
                favorite: "String"
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
    }
};

exports.links = {
    pages: {
        get: {
            doc: "Return a list of pages. Either the center or bounds parameters must be provided.",

            params: {
                center : {
                    type: "String",
                    description: 'The center latitude / longitude separated by a comma (example 42.1234121,-71.2423423)'
                },
                bounds : {
                    type: "String",
                    description: 'The bounding geographic box to search within. '+
                                 'This should be passed as 2 points - the top left (p1) and bottom right (p2). '+
                                 'Each points should be passed the same as the center attribute and also separated by a comma. '+
                                 'An example, where p1=lat1,lng1 and p2=lat2,lng2 would be passed as lat1,lng1,lat2,lng2'
                },
                favorites: {
                    type: "Boolean",
                    description: 'Pass this parameter as true to get a list of user favorites. '+
                                 'The center lat/lng should still be passed so the results can be returned in order of closest location'
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
                var center = req.param('center');
                var bounds = req.param('bounds');
                var service = req.param('service');
                var query = req.param('query');
                var favorites = req.param('favorites');
                
                if( !center && !bounds ) return Bozuko.error('page/pages_center_or_bounds_required').send(res);
                
                var options = {
                    limit: parseInt(req.param('limit')) || 25,
                    offset: parseInt(req.param('offset')) || 0
                };
                
                // first, we will try center
                if( center ){
                    
                    var parts = center.split(',');
                    if( parts.length != 2 ){
                        Bozuko.error('page/malformed_center').send(res);
                    }
                    var lat = parseFloat(parts[0]);
                    var lng = parseFloat(parts[1]);
                    options.latLng = {lat:lat, lng:lng};
                }
                
                else if(bounds){
                    var parts = center.split(',');
                    if( parts.length != 4 ){
                        Bozuko.error('page/malformed_bounds').send(res);
                    }
                    var lat1 = parseFloat(parts[0]);
                    var lng1 = parseFloat(parts[1]);
                    var lat2 = parseFloat(parts[2]);
                    var lng2 = parseFloat(parts[3]);
                    options.bounds = {
                        tl: {lat:lat1,lng:lng1},
                        br: {lat:lat2,lng:lng2}
                    };
                }
                
                if( query ) options.query = query;
                if( service ) options.service = service;
                if( favorites ) options.favorites = true;
                var profiler = Profiler.create('Page::search');
                return Bozuko.models.Page.search(options,
                    function(error, results){
                        if( error ){
                            error.send(res);
                        }
                        var searchEnd = new Date();
                        profiler.mark('search time');
                        var ret=[];
                        if( results.pages ) results.pages.forEach(function(page){
                            // is this a user favorite?
                            if( req.user ){
                                page.favorite = ~user.favorites.indexOf(page._id);
                            }
                            page.registered = true;
                            ret.push(page);
                        });
                        if( results.service_results ) ret.concat(results.service_results);
                        var pages = Bozuko.transfer('page',ret);
                        res.send(pages);
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
