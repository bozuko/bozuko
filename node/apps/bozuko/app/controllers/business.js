var facebook    = Bozuko.require('util/facebook'),
    http        = Bozuko.require('util/http'),
    Page        = Bozuko.require('util/page'),
    merge       = require('connect/utils').merge,
    qs          = require('querystring'),
    url         = require('url')    
;

exports.routes = {
    
    '/business/login' : {
        
        description :"Business login - sends user to facebook",
        
        get : function(req,res){
            Bozuko.require('auth').login(req,res,'business','/business/account',function(user){
                // need to set a flag that this user let us manage pages
                user.can_manage_pages = true;
                user.save();
            });
        }
    },
    
    '/business/account' : {
        
        description :"Display business account details",
        
        get : function(req,res){
            if( !req.session.user || !req.session.user.can_manage_pages ){
                var params = {
                    "return":url.parse(req.url).pathname
                };
                res.redirect("/business/login?"+qs.stringify(params));
                return;
            }
            
            var locals = {
                title : "your business account"
            };
            
            console.log(req.session.user._id);
            
            Bozuko.models.Page.find({owner_id:req.session.user._id}).all( function(pages){
                locals.pages = pages;
                res.render('business/account', {locals:locals});
            });
        }
    },
    
    '/business/account/add_page' : {
        
        description :"Add a new page",
        methods : ["get","post"],
        
        get : function(req,res){
            
            facebook.get_accounts(req.session.user, function(facebook_pages){
                // lets mark off the ones we know the user already owns...
                Bozuko.models.Page.find({owner_id:req.session.user._id}).all(function(user_pages){
                    var map = {};
                    user_pages.forEach(function(user_page){
                        map[user_page.facebook_id] = user_page;
                    });
                    facebook_pages.forEach(function(facebook_page){
                        if( map[facebook_page.id] ){
                            facebook_page.isOwner = true;
                        }
                    });
                    var locals = {
                        title : "add facebook page",
                        pages : facebook_pages,
                        error : req.flash('error')
                    };
                    res.render('business/account/add_page', {locals:locals} );
                });
            });
            
        },
        
        post : function(req,res){
            
            if( !req.session.user || !req.session.user.can_manage_pages ){
                req.flash('error', 'You must be logged in to add a page.');
            }
            
            var id = req.param('page');
            if( !id ){
                req.flash('error', 'No Page Selected');
                res.redirect(req.url);
                return;
            }
            // first, lets get the page details from facebook
            facebook.graph('/'+id,{
                user : req.session.user
            }, function(data){
                if( !data ){
                    req.flash('error', 'That page does not exist');
                    res.redirect(req.url);
                    return;
                }
                Bozuko.models.Page.find({facebook_id:id}).first(function(page){
                    if( page && page.owner_id != req.session.user._id ){
                        /**
                         * TODO
                         *
                         * Allow multiple admins of a page...
                         * 
                         */
                        req.flash('error', 'This page is being managed by someone else. Currently, only one person can manage a page.');
                        res.redirect(req.url);
                        return;
                    }
                    else if( !page ) page = new Bozuko.models.Page();
                    page.facebook_id = data.id;
                    page.facebook_auth = req.session.user.facebook_auth;
                    page.name = data.name;
                    page.is_location = data.location && data.location.latitude ? true : false;
                    if( page.is_location ){
                        page.lat = data.location.latitude;
                        page.lng = data.location.longitude;
                    }
                    page.owner_id = req.session.user._id;
                    page.save();
                    
                    // cool, we have them saved now...
                    res.redirect('/business/account/page/'+page.facebook_id+'/create_games');
                    
                });
            });
            
        }
        
    },
    
    '/business/account/page/:id/create_games' : {
        description :'Create games for the page (setup screen)',
        get : function(req,res){
            var id = req.param('id');
            // lets grab all the games we know of
            var games = [];
            var locals = {};
            Bozuko.models.Page.find({facebook_id:id}).first(function(page){
                // if we do not have a record, they did not add it correctly
                if( !page ){
                    req.flash('error', 'You cannot create games for pages you have not yet added');
                    res.redirect('/business/account');
                    return;
                }
                
                /**
                 * TODO we should check for the parent page here
                 */
                
                // okay... lets see what games they have
                Object.keys(Bozuko.games).forEach( function(name){
                    var game = Bozuko.games[name];
                    games.push(merge(game.config,{_id:name}));
                });
                
                locals.games = games;
                locals.title = "Create Games";
                res.render('business/account/create_games',{locals : locals});
                
            });
        }
    },
    
    '/business/facebook_pages' : {
        
        description :"Return an array of the pages that the user can manage",
        
        get: function(req,res){
            facebook.get_accounts(req.session.user, function(pages){
                res.send(pages);
            });
        }
    },
    
    '/business/facebook_page/:id' : {
        
        description :"Return the details of a page",
        
        get : function(req,res){
            facebook.graph('/'+req.param('id'),
                {
                    user: req.session.user
                },
                function(page){
                    res.send(page);
                }
            );
        }
    },
    
    '/business' : Page('bozuko for business', 'business/index')
};