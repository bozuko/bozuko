var facebook    = Bozuko.require('util/facebook'),
    http        = Bozuko.require('util/http'),
    Page        = Bozuko.require('util/page'),
    merge       = require('connect').utils.merge,
    qs          = require('querystring'),
    url         = require('url')    
;

exports.renderOptions = {
    title : "Bozuko for Business"
};

exports.routes = {
    
    '/business/login' : {
        
        description :"Business login - sends user to facebook",
        
        get : function(req,res){
            Bozuko.require('core/auth').login(req,res,'business',req.param('return') || '/business/account',function(user){
                // need to set a flag that this user let us manage pages
                user.can_manage_pages = true;
                user.save(function(){});
            });
        }
    },
    
    '/business/sign-up' : {
        
        description :"Business registration - sends user to facebook",
        
        get : function(req,res){
            Bozuko.require('core/auth').login(req,res,'business','/business/account',function(user){
                // need to set a flag that this user let us manage pages
                user.can_manage_pages = true;
                user.save(function(){});
            });
        }
    },
    
    '/business/account' : {
        
        description :"Display business account details",
        
        get : function(req,res){
            console.log(req.session);
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
            
            Bozuko.models.Page.find({owner_id:req.session.user._id}, function(err, pages){
                locals.pages = pages||[];
                res.render('business/account', locals);
            });
        }
    },
    
    '/business/account/add_page' : {
        
        description :"Add a new page",
        
        get : function(req,res){
            
            var self = this;
            
            Bozuko.service('facebook').get_user_pages(req.session.user, function(err, facebook_pages){
                var locals = {
                    title : "add facebook page",
                    pages : facebook_pages || [],
                    error : req.flash('error')
                };
                res.render('business/account/add_page', locals );
                
            });
            
        },
        
        post : function(req,res){
            
            var self = this;
            
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
                Bozuko.models.Page.findOne({'services.name':'facebook','services.sid':id}, function(err, page){
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
                        // cool, we have them saved now...
                        res.redirect('/business/account/page/'+page.id+'/create_games');
                    });
                    
                });
            });
            
        }
        
    },
    
    '/business/account/page/:id/delete' : {
        description : 'Delete a page from a business account',
        get : function(req,res){
            
            var id = req.param('id');
            var locals = {
                title:'Remove a page',
                page:null
            };
            Bozuko.models.Page.findById(id, function(err, page){
                if( err ){
                    // yikes, i don't think we have one by that id...
                    locals.error= 'The requested page could not be found';
                    req.render('business/account/remove_page', {locals:locals} );
                }
                else{
                    locals.page = page;
                }
                res.render('business/account/remove_page', locals );
            });
        },
        
        post : function(req,res){
            var id = req.param('id');
            Bozuko.models.Page.findById(id, function(err, page){
                if( err ){
                    // yikes, i don't think we have one by that id...
                    req.flash('error', 'The requested page could not be found');
                    res.redirect('/business/account');
                }
                else{
                    page.remove(function(err){
                        if( err ){
                            req.flash('error', 'There was an error removing the page');
                        }
                        else{
                            req.flash('info', "The page was removed successfully");
                        }
                        res.redirect('/business/account');
                    });
                }
                
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
            Bozuko.models.Page.findById(id, function(err,page){
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
                locals.page = page;
                locals.games = games;
                locals.title = "Create Games";
                res.render('business/account/create_games',locals);
                
            });
        }
    },
    
    '/business/facebook_pages' : {
        
        description :"Return an array of the pages that the user can manage",
        
        get: function(req,res){
            Bozuko.service('facebook').get_user_pages(req.session.user, function(err, pages){
                res.send(pages);
            });
        }
    },
    
    '/business/facebook_page/:id' : {
        
        description :"Return the details of a page",
        
        get : function(req,res){
            Bozuko.service('facebook').place(req.param('id'),
                {
                    user: req.session.user
                },
                function(page){
                    res.send(page);
                }
            );
        }
    }
};