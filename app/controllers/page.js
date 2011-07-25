var async = require('async'),
    qs = require('querystring'),
    http = Bozuko.require('util/http'),
    URL = require('url'),
    mailer = Bozuko.require('util/mail'),
    burl = Bozuko.require('util/url').create,
    Profiler = Bozuko.require('util/profiler')
;

var requestCount = 0;

exports.transfer_objects = {

    page: {

        doc: "A Bozuko Page",

        def: {
            id: "String",
            name: "String",
            image: "String",
            share_url: "String",
            like_url: "String",
            like_button_url: "String",
            facebook_page: "String",
            category: "String",
            website: "String",
            featured: "Boolean",
            favorite: "Boolean",
            liked: "Boolean",
            registered: "Boolean",
            announcement: "String",
            distance: "String",
            is_place: "Boolean",
            is_facebook: "Boolean",
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
            checkins: "Number",
            games: ["game"],
            links: {
                recommend: "String",
                facebook_checkin: "String",
                feedback: "String",
                favorite: "String",
                page: "String"
            }
        },

        create: function(page, user, callback){
            // this should hopefully be a Page model object
            // lets check for a contest
            var self = this;
            var createPage = function(){
                var prof = new Profiler('/controllers/page/create_page');
                var fid = page.registered ? page.service('facebook').sid : page.id;
                if( !page.registered ) delete page.id;
                page.liked = false;
                page.image = page.image + (~page.image.indexOf('?')?'&':'?')+'return_ssl_resources=1';
                page.like_url = burl('/facebook/'+fid+'/like.html');
                page.like_button_url = burl('/facebook/'+fid+'/like_button.html');
                page.links = {
                    facebook_page       :'http://facebook.com/'+fid,
                    facebook_checkin    :'/facebook/'+fid+'/checkin'
                    // facebook_like       :'/facebook/'+fid+'/like'
                };
                page.is_place = page.location  && page.location.lat && page.location.lng;
                if( page.registered ){
                    // page.image = burl('/page/'+page.id+'/image?version=8');
                }
                if( user ){
                    page.like_url +='?token='+user.token;
                    page.like_button_url += '?token='+user.token;
                    if( page.registered ){
    
                        // favorite
                        if( ~user.favorites.indexOf( page.id ) ) page.favorite = true;
                        page.links.favorite = '/user/favorite/'+page.id;
    
                        if( page.service('facebook') ){
                            try{
                                page.liked = user.likes(page);
                                if( page.liked ) delete page.links.facebook_like;
                            }catch(e){
                                page.liked = false;
                            }
                        }
                    }
                    else{
                        try{
                            page.liked = user.likes(fid);
                            if( page.liked ) delete page.links.facebook_like;
                        }catch(e){
                            page.liked = false;
                        }
                    }
                }
                
                page.is_facebook = ( !page.registered || page.service('facebook') );
    
                // add registered links...
                if( page.registered ){
                    page.share_url         =burl('/business/'+page.id);
                    page.links.page         ='/page/'+page.id;
                    page.links.share        ='/page/'+page.id+'/share';
                    page.links.feedback     ='/page/'+page.id+'/feedback';
                }
                // non-registered links
                else{
                    page.links.recommend    ='/page/recommend/facebook/'+fid;
                }
    
                page.games = [];
                
                if( page.contests ){
                    page.contests.sort(function(a,b){
                        return +b.start-a.start;
                    });
                    page.contests.forEach(function(contest){
                        page.games.push( contest.getGame() );
                    });
                }
    
                prof.mark('after creating page');
                return self.sanitize(page, null, user, function(){
                    profile.mark('after sanitize');
                    callback.apply(this, arguments);
                });
            };
            return createPage();
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
exports.session = false;

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
            },

            returns: "success_message"
        }
    },

    recommend: {
        post: {
            access: 'user',
            doc: 'Allow a user to recommend Bozuko to a place',
            params: {
                message:{
                    required: true,
                    type: "String",
                    description: "The message to send to the Business / Bozuko"
                }
            },
            returns: 'success_message'
        }
    }
};

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

                if( req.param('throw_error')){
                    throw new Error('intentional error');
                }

                if( !ll) return Bozuko.error('page/pages_no_ll').send(res);



                var options = {
                    limit: parseInt(req.param('limit')) || 25,
                    offset: parseInt(req.param('offset')) || 0,
                    user: req.session.user,
                    hideFeaturedPastThreshold: true
                };

                var url_parsed = URL.parse(req.url);
                var params = qs.parse(url_parsed.query);

                params['limit'] = options.limit;
                params['offset'] = options.offset+options.limit;

                var next = url_parsed.pathname+'?'+qs.stringify(params);

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
                if( favorites ){
                    options.favorites = true;
                    options.sort = {'name': 1};
                }
                
                var profiler = Profiler.create('controller/page/search');

                return Bozuko.models.Page.search(options,
                    function(error, pages){
                        if( error )return error.send(res);
                        
                        profiler.mark('after search');

                        var ret = {
                            pages:pages
                        };
                        if( pages.length ) ret.next = next;
                        return Bozuko.transfer('pages', ret, req.session.user, function(error, result){
                            profiler.mark('after transfer');
                            res.send( error || result );
                        });
                    }
                );
            }
        }
    },

    '/page/:id': {

        get: {
            handler: function(req,res) {
                var page_id = req.param('id');
                Bozuko.models.Page.findById(page_id, function(error, page) {
                    if( error ) return error.send(res);
                    if( !page ) return Bozuko.error('page/does_not_exist').send(res);

                    page.registered=true;

                    // need to popuplate the page with the right stuff
                    return page.loadContests( req.session.user, function(error){
                        if( error ) return error.send(res);
                        return Bozuko.transfer('page', page, req.session.user, function(error, result){
                            res.send( error || result );
                        });
                    });
                });
            }
        }
    },

    '/page/:id/feedback': {

        put: {
            handler: function(req,res) {
                var page_id = req.param('id');
                Bozuko.models.Page.findById(page_id, function(error, page) {
                    if( error ) return error.send(res);
                    if( !page ) return Bozuko.error('page/does_not_exist').send(res);

                    var message = req.param('message');
                    
                    Bozuko.publish('page/feedback', {message:req.param('message')});
                    
                    var feedback = new Bozuko.models.Feedback({
                        user_id: req.session.user.id,
                        page_id: page_id,
                        message: message
                    });
                    return feedback.save( function(error){
                        if( error ) return error.send( res );
                        
                        /**
                         * Async process
                         */
                        mailer.send({
                            to: 'feedback@bozuko.com',
                            subject: "New Feedback from a Bozuko User!",
                            body: [
                                req.session.user.name+' ('+req.session.user.email+')' +
                                ' just submitted the following feedback for '+page.name+' ('+page.service('facebook').data.link+'):',
                                '',
                                message,
                                '',
                                '--',
                                '- The Bozuko Mailer (please do not reply to this email)'
                            ].join("\n")
                        }, function(error){
                            if( error ){
                                console.error('Error sending feedback! ['+feedback._id+']');
                            }
                        });
                        
                        return Bozuko.transfer('success_message', {success:true}, null, function(error, result){
                            res.send( error || result );
                        });
                    });
                });
            }
        }
    },

    'page/:id/image': {

        get : {
            handler : function(req,res){
                Bozuko.models.Page.findById(req.param('id'), function(error, page) {
                    if( error ) return error.send(res);
                    var url = page.image,
                        type = req.param('type');
                    if( type ){
                        url = url.replace(/type=[a-zA-Z0-9]+/, 'type='+type);
                    }
                    // return http.stream( url, res, {buffered: false} );
                    // return res.redirect( url );
                    return http.redirect( url, res );
                });
                
                
            }
        }
    },

    'page/recommend/:service/:id': {
        
        access : 'user',

        post : {

            handler : function(req,res){
                /**
                 * TODO - add the recommendation logic
                 */
                var id = req.param('id'),
                    user = req.session.user,
                    service = req.param('service'),
                    message = req.param('message') || '';
                    
                async.series({
                    page : function(callback){
                        return Bozuko.models.Page.findByService(service, id, function(err, page) {

                            if( err ){
                                return callback( err );
                            }
                            if( page ){
                                return callback( null, page );
                            }
                            return Bozuko.service(service).place({place_id:id}, function(error, place){
                                if( error ){
                                    return callback(error);
                                }
                                if( !place ){
                                    return callback(Bozuko.error('facebook/bad_place_id'));
                                }
                                return Bozuko.models.Page.createFromServiceObject( place, function(error, page){
                                    if( error ) return callback(error);
                                    return callback( null, page )
                                });
                            });
                        });
                    }
                }, function finish(error, result){
                    if( error ) return error.send( res );
                    
                    var page = result.page;
                    
                    var recommendation = new Bozuko.models.Recommendation();
                    recommendation.page_id = page._id;
                    recommendation.user_id = user._id;
                    recommendation.message = message;
                    
                    return recommendation.save( function(error){
                        if( error ) return error.send(res);
                        /**
                        * Async process
                        */
                        mailer.send({
                            to: 'feedback@bozuko.com',
                            subject: "New Recommendation from a Bozuko User!",
                            body: [
                                user.name+' ('+user.email+')' +
                                ' just submitted the following recommendation for '+page.name+' ('+page.service('facebook').data.link+'):',
                                '',
                                message,
                                '',
                                '--',
                                '- The Bozuko Mailer (please do not reply to this email)'
                            ].join("\n")
                        }, function(error){
                            if( error ){
                                console.error('Error sending recommendation! ['+recommendation._id+']');
                            }
                        });
                        
                        Bozuko.publish('page/recommend', {message:message, service:service, page: page.name});
                        return Bozuko.transfer('success_message', {success: true}, null, function(error, result){
                            return res.send( error || result );
                        });
                    });
                });
            }
        }

    }
};
