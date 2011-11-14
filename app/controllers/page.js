var async = require('async'),
    qs = require('querystring'),
    http = Bozuko.require('util/http'),
    Geo = Bozuko.require('util/geo'),
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
