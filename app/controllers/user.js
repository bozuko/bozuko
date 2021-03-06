var Profiler = Bozuko.require('util/profiler');
var inspect = require('util').inspect;

exports.session = false;

exports.routes = {

    '/user/login/:service?' : {

        description :"User login - sends user to facebook",

        aliases     :['/login/:service?'],

        get : function(req,res){

            // if we are being redirected with a token, its internal
            if( req.param('token')){
                // lets show the response screen
                res.locals.user = req.session.user;
                res.locals.title = 'You are Logged In';
                return res.render('app/user/login_thanks');
            }

            service = req.param('service') || 'facebook';
            if( req.param('return') ){
                req.session.user_redirect = req.param('return');
            }
            else if(req.param('phone_id') && req.param('phone_type')){
                req.session.device='touch';
                req.session.user_redirect = '/user/mobile';
            }
            return Bozuko.service(service).login(
                req,
                res,
                'user',
                req.session.user_redirect||'/user',
                null,
                function(error, req, res){
                    // we need to see what the deal is here...
                    if( error.name){
                        if( error.name == 'http/timeout' ){
                            // we should let them know what happened
                            res.locals.title = "Facebook is taking a long time...";
                            res.render('app/user/facebook_auth_timeout');
                            return false;
                        }
                        if (error.name === 'user/blocked') {
                            res.locals.title = "Access Denied";
                            res.render('app/user/blocked');
                            return false;
                        }
                    }
                    res.locals.title = ":'(";
                    res.render('app/user/permission_denied');
                    return false;
                }
            );
        }
    },

    '/user/mobile' : {
        get : {

            access: 'user',
            handler: function(req,res){
                var token = req.session.user.token;
                res.redirect('/user/login?token='+token);
            }
        }
    },

    '/user/logout' : {

        description :"User logout",

        aliases: ['/logout'],

        get : {

            handler: function(req,res){
                req.session.destroy();
                return res.send( {success: true, title: "Logout", message: "You have been logged out"} );
            }
        }
    },
    
    '/user' : {

        get : {

            access: 'user',

            handler: function(req, res) {
                var user = req.session.user;
                // we should update the user's likes

                return user.updateInternals( true, function(error){
                    if( error ) return error.send(res);

                    // not only that, we should check to see if there is a "liked" page being referenced
                    // here
                    var liked = req.param('liked');
                    if( liked && user.service('facebook') ){
                        var internal = user.service('facebook').internal;
                        if( internal.likes && ~internal.likes.indexOf( liked ) ){
                            // boom, we got a weiner!
                            // lets see if we have a page for this
                            Bozuko.models.Page.findByService('facebook', liked, function(error, page){
                                if( error || !page ) return;
                                
                                var selector = {
                                    service         :'facebook',
                                    type            :'like',
                                    page_id         :page._id,
                                    user_id         :user._id
                                }, game = req.param('game');
                                
                                // find share
                                Bozuko.models.Share.findOne(selector, function(error, share){
                                    if(!share){
                                        share = new Bozuko.models.Share(selector);
                                        share.visibility = internal.friend_count||0;
                                        if(game) share.contest_id = game;
                                    }
                                    if(game && !share.contest_id){
                                        share.contest_id = game;
                                    }
                                    
                                    share.save(function(error){
                                        if( error ) console.error( error );
                                        else console.log('Facebook Like through Bozuko: Page='+page.name+', User='+user.name);
                                    });
                                });
                            });
                        }
                    }

                    user.id = user._id;
                    user.links = {
                        logout: "/user/logout",
                        favorites: "/user/favorites"
                    };
                    return Bozuko.transfer('user', user, user, function(error, result){
                        if (result) {
                            //console.error('\nuser transfer = '+inspect(result)+'\n\n');
                        } else {
                            //console.error('\n no transfer user\n');
                        }
                        if (error) return error.send(res);
                        return res.send( result );
                    });
                });
            }
        },
        
        post : {
            access: 'mobile',
            
            handler : function(req, res){
                
                var user = req.session.user;
                
                // the only thing we are going to change right now is email...
                var email = req.param('email');
                
                if( email && !email.match(/.+@.+\..+/) ){
                    return Bozuko.transfer('user_success_message', {
                        success: false,
                        message: 'Please enter a valid email address',
                        title: 'Invalid email'
                    }, user, function(error, result){
                        res.send(error || result);
                    });
                }
                
                // save address fields if they are passed -
                // assume client validation
                var fields = ['ship_name','address1','address2','city','state','zip'];
                var v;
                for(var x=0; x<fields.length; x++){
                    var i = fields[x];
                    if((v = req.param(i))) user.set(i, v);
                }
                
                if(email){
                    user.email = email;
                    user.user_email = true;
                }
                
                return user.save(function(error){
                    if( error ) return error.send(res);
                    
                    return Bozuko.transfer('user_success_message', {
                        success: true,
                        message: 'Your details have been updated successfully',
                        title: 'User Updated',
                        user:user
                        
                    }, user, function(error, result){
                        res.send(error || result);
                    });
                });
                
            }
        },
        
        // ssh...
        put : {
            access : 'developer',
            
            handler : function(req, res) {
                var data = req.param('data');
                if( !data ) {
                    return res.send(Bozuko.error('user/empty'));
                }
                if( !data.service ){
                    return res.send(Bozuko.error('user/service_required'));
                }
                if( !data.service == 'facebook' ){
                    // we can't accept this
                    return res.send(Bozuko.error('user/create_facebook_only'));
                }
                
                var user = Bozuko.service('facebook').sanitizeUser( data );
                user.token = data.token;
                user.service = 'facebook';
                
                return Bozuko.models.User.addOrModify( user, null, function(error, user){
                    if(error) return res.send(error);
                    return Bozuko.transfer('user', user, null, function(error, result){
                        return res.send( error || result );
                    });
                });
                
            }
        }
    },

    '/user/favorites' : {

        get : {
            access: 'user',

            handler: function(req, res) {
                
                // a get request is just all favorites
                // we need to have the token by now...
                var token = req.param('token');
                var ll = req.param('ll');
                if( !token || !ll ){
                    return Bozuko.error('user/favorites_no_ll').send(res);
                }
                return res.redirect('/pages?favorites=true&ll='+ll+'&token='+token);
            }
        }

    },

    '/user/favorite/:id':{

        put: {
            access: 'user',
            handler: function(req, res) {
                console.log('hi');
                var id = req.param('id');
                var user = req.session.user;
                var favorites = user.favorites;
                var found = false;

                var prof = new Profiler('/controllers/user/favorite/put');
                if( favorites ) for(var i=0; i<favorites.length && found == false; i++){
                    if( favorites[i]+'' == id ){
                        found = i;
                        break;
                    }
                }
                prof.stop();
                if( found !== false ){
                    return Bozuko.error('user/favorite_exists').send(res);
                }
                // lets make sure the page exists
                return Bozuko.models.Page.findById(id, function(error, page){
                    if( error ){
                        return error.send(res);
                    }
                    if( !page ) return Bozuko.error('page/does_not_exist').send(res);
                    user.favorites.push(id);
                    return user.save(function(error){
                        if(error) return error.send(res);
                        return Bozuko.transfer('favorite_response', {
                            added: true,
                            page_id: id
                        }, user, function(error, result){
                            if (error) return error.send(res);
                            res.send( result );
                        });
                    });
                });
            }
        },

        del: {
            access: 'user',
            handler: function(req, res) {
                var id = req.param('id');
                var user = req.session.user;
                var favorites = user.favorites;
                var found = false;

                var prof = new Profiler('/controllers/user/favorite/del');
                if( favorites ) for(var i=0; i<favorites.length && found === false; i++){
                    if( favorites[i]+'' == id ){
                        found = i;
                        break;
                    }
                }
                prof.stop();
                if( found === false ){
                    return Bozuko.error('user/favorite_does_not_exist').send(res);
                }
                // lets make sure the page exists
                return Bozuko.models.Page.findById(id, function(error, page){
                    if( error ) return error.send(res);
                    if( !page ) return Bozuko.error('page/does_not_exist').send(res);
                    user.favorites.splice(found,1);
                    // weird mongoose shit...
                    user.commit('favorites');
                    return user.save(function(error){
                        if(error) return error.send(res);
                        return Bozuko.transfer('favorite_response', {
                            removed: true,
                            page_id: id
                        }, user, function(error, result){
                            if (error) return error.send(res);
                            res.send( result );
                        });
                    });
                });
            }
        },

        post: {
            access: 'user',
            handler: function(req, res) {
                var id = req.param('id');
                var user = req.session.user;
                var favorites = user.favorites;
                var found = false;

                var prof = new Profiler('/controllers/user/favorite/post');
                if( favorites ) for(var i=0; i<favorites.length && found === false; i++){
                    if( favorites[i]+'' == id ){
                        found = i;
                        break;
                    }
                }
                prof.stop();

                // lets make sure the page exists
                return Bozuko.models.Page.findById(id, function(error, page){
                    if( error ) return error.send(res);
                    if( !page ) return Bozuko.error('page/does_not_exist').send(res);
                    var ret = {
                        page_id: id
                    };
                    if( found !== false ){
                        user.favorites.splice(found,1);
                        user.commit('favorites');
                        ret.removed = true;
                    }
                    else{
                        user.favorites.push(id);
                        ret.added = true;
                    }
                    return user.save(function(error){
                        if(error) return error.send(res);
                        return Bozuko.transfer('favorite_response', ret, user, function(error, result){
                            if (error) return error.send(res);
                            return res.send( result );
                        });
                    });
                });
            }
        }
    }
};
