var async = require('async'),
    qs = require('querystring'),
    http = Bozuko.require('util/http'),
    Geo = Bozuko.require('util/geo'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId,
	XRegExp = Bozuko.require('util/xregexp'),
    URL = require('url'),
    mailer = Bozuko.require('util/mail'),
    indexOf = Bozuko.require('util/functions').indexOf,
    burl = Bozuko.require('util/url').create,
    Profiler = Bozuko.require('util/profiler')
;

var requestCount = 0;

exports.session = false;

exports.routes = {

    '/pages': {

        aliases: ['/pages/:service?', '/places/:service?', '/places'],

        get: {

            handler: function(req,res) {
				
				
                var ll = req.param('ll');
                var accuracy = req.param('accuracy');
                var bounds = req.param('bounds');
                var service = req.param('service');
                var query = req.param('query');
                var favorites = req.param('favorites');
				
				// if we are an api guy, only get their own stuff
				if(req.apikey){
					var selector = {
						apikey_id: req.apikey._id
					};
					if(query) selector.name = new RegExp('(^|\\s)'+XRegExp.escape(options.query), "i");
                    
					return Bozuko.models.Page.count(selector, function(error, count){
						
                        var limit = parseInt(req.param('limit')) || 25
                          , offset = parseInt(req.param('offset')) || 0
                          ;
                        
						var opts = {
							limit: limit,
							offset: offset
						};
						
						return Bozuko.models.Page.find(selector, {}, opts, function(error, pages){
							if(error) return error.send(res);
							var ret = {pages: pages, count: count, offset: offset, limit: limit};
                            pages.forEach(function(page){
                                page.registered = true;
                            });
							return Bozuko.transfer('pages', ret, req.session.user, function(error, result){
								if (error) return error.send(res);
								return res.send( result );
							});
						});
					});
				}

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

                        var dbug = [];
                        pages.forEach(function(page){
                            if( page.is_location ){
                                dbug.push({
                                    page_name: page.name,
                                    distance: page.distance
                                });
                            }
                        });

                        Bozuko.publish('api/pages', {
                            user: req.session.user ? req.session.user.name : 'Anonymous',
                            ll: ll,
                            accuracy: accuracy,
                            pages: dbug
                        });


                        if( pages.length ) ret.next = next;
                        return Bozuko.transfer('pages', ret, req.session.user, function(error, result){
                            profiler.mark('after transfer');
                            if (error) return error.send(res);
                            return res.send( result );
                        });
                    }
                );
            }
        }
    },

    '/page/:id?': {
        
        get: {
            handler: function(req,res) {
                var page_id = req.param('id');
                if( !page_id ) return Bozuko.error('page/does_not_exist').send(res);
                return Bozuko.models.Page.findById(page_id, function(error, page) {
                    if( error ) return error.send(res);
                    if( !page ) return Bozuko.error('page/does_not_exist').send(res);

                    page.registered=true;

                    // need to popuplate the page with the right stuff
                    return page.loadContests( req.session.user, function(error){
                        if( error ) return error.send(res);
                        return Bozuko.transfer('page', page, req.session.user, function(error, result){
                            if (error) return error.send(res);
                            return res.send( result );
                        });
                    });
                });
            }
        },
        
        put : {
            
            access : 'developer_private',
            handler : function(req, res){
                
                Bozuko.models.Page.apiCreate(req, function(error, page){
                    if(page) page.registered = true;
                    
                    Bozuko.transfer('page_save_result', {
                        success: error ? false : true,
						errors: error ? error.errors() : null,
						error: error ? error.message : null,
                        page: page
                    }, req.session.user, function(error, result){
                        if (error) return error.send(res);
                        return res.send( result );
                    });
                });
                
            }
        },
        
        post : {
            
            access : 'developer_private',
            handler : function(req, res){
                Bozuko.models.Page.apiUpdate(req, function(error, page){
                    if(page) page.registered = true;
                    
                    Bozuko.transfer('page_save_result', {
                        success: error ? false : true,
						errors: error ? error.errors() : null,
						error: String(error),
                        page: page
                    }, req.session.user, function(error, result){
                        if (error) return error.send(res);
                        return res.send( result );
                    });
                });
            }
        }
    },
    
    '/page/:id/games' : {
        get : {
            access : 'developer_public',
            handler : function(req, res){
                return Bozuko.models.Page.findById(req.param('id'), function(error, page){
                    // get all games
                    if(error) return error.send(res);
                    return Bozuko.models.Contest.count({page_id: page._id},function(error, count){
                        if(error) return error.send(res);
                        
                         var limit = req.param('limit') || 25
                           , start = req.param('start') || 0
                           ;
                        
                        return Bozuko.models.Contest.find({page_id: page._id}, {results: 0}, {
                            limit : limit,
                            offset : start,
							sort: {start: -1}
                        }, function(error, contests){
                            if(error) return error.send(res);
                            
                            var games=[];
                            
                            // prepare
                            return async.forEachSeries(contests, function iterator(contest, cb){
                                contest.loadGameState({user:null, page_id: page._id}, function(error){
                                    if(error) return cb(error);
                                    games.push(contest.getGame());
                                    return cb();
                                });
                                
                            }, function return_games(error){
                                if(error) return error.send(res);
                                return Bozuko.transfer('page_games', {
                                    games: games,
                                    count: count,
                                    start: start,
                                    limit: limit
                                }, req.apikey, function(error, result){
                                    return res.send(error || result);
                                });
                            });
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
                            reply_to: req.session.user.email,
                            subject: "New Feedback from a Bozuko User!",
                            body: [
                                req.session.user.name+' ('+req.session.user.email+')' +
                                ' just submitted the following feedback for '+page.name+' ('+
                                (page.service('facebook') ?
                                    page.service('facebook').data.link :
                                    'https://bozuko.com/p/'+page.id
                                )+
                                '):',
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
                        // get the admins...
                        Bozuko.models.User.find({_id: {$in: page.admins||[]}}, function(error, users){
                            if( error ) return;
                            users.forEach(function(user){
                                mailer.send({
                                    to : user.email,
                                    reply_to: req.session.user.email,
                                    subject: "New Feedback from a Bozuko User!",
                                    body: [
                                        req.session.user.name+' ('+req.session.user.email+')' +
                                        ' just submitted the following feedback for '+page.name+':',
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
                            });
                        });

                        return Bozuko.transfer('success_message', {success:true}, null, function(error, result){
                            if (error) return error.send(res);
                            res.send( result );
                        });
                    });
                });
            }
        }
    },

    '/page/:id/image': {

        get : {
            handler : function(req,res){
                Bozuko.models.Page.findById(req.param('id'), function(error, page) {
                    if( error ) return error.send(res);
                    // check to make sure we have a page..
                    if( !page ) {
                        console.error('page/:id/image - page not found ['+req.param('id')+']');
                        return res.redirect('/images/assets/icons/unknown.png');
                    }
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

    '/page/recommend/:service/:id': {

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

                        /**
                         * Send an Auto Reply to the user
                         */
                         mailer.send({
                            to: user.email,
                            subject: "Thank you for your recommendation!",
                            body: [
                                'Hi '+user.name+'-',
                                '',
                                'Thank you for your Bozuko recommendation for '+page.name+'! '+
                                'We compile all of our recommendations and use them to help prioritize our Bozuko roll out.',
                                '',
                                'The best way to recommend Bozuko to your favorite businesses is posting on their wall. Make sure to use @Bozuko so your post links back to our page. '+
                                'For example, post something like this on their wall:  "I think you guys are awesome. You should rock a @Bozuko game!"',
                                '',
                                'Here is a link to their wall:',
                                page.service('facebook').data.link,
                                '',
                                'Your original message was: ',
                                message,
                                '',
                                'Thanks-',
                                'The Bozuko Team'
                            ].join("\n")
                        }, function(error){
                            if( error ){
                                console.error('Error sending recommendation! ['+recommendation._id+']');
                            }
                        });

                        Bozuko.publish('page/recommend', {message:message, service:service, page: page.name});
                        return Bozuko.transfer('success_message', {success: true}, null, function(error, result){
                            if (error) return error.send(res);
                            return res.send( result );
                        });
                    });
                });
            }
        }

    }
};
