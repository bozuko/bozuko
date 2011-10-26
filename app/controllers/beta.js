var Content     = Bozuko.require('util/content'),
    validator   = require('validator'),
    mailer      = Bozuko.require('util/mail'),
    Report      = Bozuko.require('core/report'),
    DateUtil    = Bozuko.require('util/date'),
    async       = require('async'),
    Dashboard   = require('./base/dashboard'),
    http        = Bozuko.require('util/http'),
    PDF         = require('pdfkit'),
    indexOf     = Bozuko.require('util/functions').indexOf,
    filter      = Bozuko.require('util/functions').filter,
    array_map   = Bozuko.require('util/functions').map,
    s3          = Bozuko.require('util/s3'),
    GD          = require('node-gd'),
    fs          = require('fs'),
    Path        = require('path'),
    ObjectId    = require('mongoose').Types.ObjectId,
    XRegExp     = Bozuko.require('util/xregexp'),
    crypto      = require('crypto')
    ;

exports.locals = {
    home_link: '/beta',
    home_title: 'Bozuko Beta',
    layout: 'beta/layout',
    device: 'desktop',
    title: 'Bozuko Beta',
    meta: {
        'charset':'utf-8',
        'author':'Bozuko Inc.',
        'description': 'Bozuko Beta Customer Area.',
        'robots' : 'noindex,nofollow'
    },
    nav: [],
    html_classes: [],
    head_scripts: [
        
    ],
    scripts: [
        
    ],
    styles: [
        '/css/desktop/style.css'+Date.now(),
        '/css/desktop/layout.css'+Date.now(),
        '/css/desktop/beta/style.css?'+Date.now()
    ]
};

exports.init = function(){
    
};

exports.restrictToUser = true;

exports.routes = {
    '/beta/(page/:page_id)?' : {
        get : {
            handler : function(req, res){
                var user = req.session.user,
                    page_id = req.param('page_id');
                
                if( !user || !req.session.beta_session ){
                    if( req.param('page_id') ){
                        req.session.page_id = page_id;
                    }
                    else{
                        req.session.page_id = false;
                    }
                    res.locals.styles = [
                        'https://fonts.googleapis.com/css?family=Open+Sans:300italic,400italic,600italic,700italic,800italic,400,800,700,600,300',
                        '/css/desktop/style.css',
                        '/css/desktop/layout.css',
                        '/css/desktop/beta/landing.css',
                        '/css/desktop/beta/style.css'
                    ];
                    res.locals.head_scripts = [
                        '/js/jquery/jquery.tools.min-1.2.6.js',
                        '/js/desktop/beta/welcome.js'
                    ]
                    return res.render('beta/welcome');
                }
                
                var selector = {};
                if( req.param('page_id') ){
                    selector._id = page_id;
                }
                else{
                    req.session.page_id = false;
                }
                return user.getManagedPages(selector, function(error, pages){
                    if( error ) throw error;
                    
                    if( !pages.length ){
                        return res.redirect('/beta/create-account');
                    }
                    
                    var signed = false,
                        page;
                        
                    if( user.last_viewed_page ){
                        // find that page..
                        for(var i=0; i<pages.length && !page; i++){
                            var p = pages[i];
                            if( String(p._id) == String(user.last_viewed_page) ){
                                page = p;
                                signed = page.beta_agreement.signed;
                            }
                        }
                    }
                    
                    while( !page && !signed && pages.length ){
                        page = pages.pop();
                        signed = page.beta_agreement.signed;
                    }
                    if( !signed ){
                        req.session.page_id = page.id;
                        // use the last page...
                        return res.redirect('/beta/agreement');
                    }
                    
                    res.locals.html_classes.push('beta-app');
                    res.locals.user = user;
                    res.locals.page = page;
                    
                    user.last_viewed_page = page._id;
                    user.save();
                    
                    res.locals.scripts.unshift(
                        '/js/ext-4.0/lib/ext-all.js',
                        //'/js/desktop/beta/all-classes.js',
                        '/js/desktop/beta/app.js'
                    );
                    res.locals.styles.unshift(
                        '/js/ext-4.0/lib/resources/css/ext-all-gray.css',
                        '/css/desktop/business/style.css?v2',
                        '/css/desktop/admin/app.css'
                    );
                    
                    // get the user pages...
                    return Bozuko.models.Page.find({_id:{$in:user.manages}}, {name:1,_id:1,image:1}, function(error, pages){
                        if( error ) throw error;
                        res.locals.user_pages = filter(pages,'_id', 'name','image');
                        return res.render('beta/index.jade');
                    });
                });
            }
        }
    },
    
    '/beta/form' : {
        post : {
            handler: function(req, res){
                // check the form...
                var name = req.param('name'),
                    email = req.param('email'),
                    message = req.param('message'),
                    success = true
                    ;

                try{
                    validator.check(name, 'Please enter your name').notEmpty();
                    validator.check(email, 'Please enter a valid email address').isEmail();
                    validator.check(message, 'Message cannot be empty').notEmpty();
                }catch(e){
                    res.locals.token = getToken(req.session, true);
                    res.locals.errors = [e.message];

                    res.locals.name = name;
                    res.locals.email = email;
                    res.locals.message = message;

                    return res.send({success:false});
                }

                // send an email...
                
                mailer.send({
                    to: 'info@bozuko.com',
                    reply_to: email,
                    subject: "New Bozuko Beta Inquiry",
                    body: name+' <'+email+'> sent the following message:\n\n'+message
                });
                
                return res.send({success:true});
            }
        }
    },
    
    '/beta/login' : {
        get : function(req,res){
            Bozuko.require('core/auth').login(req,res,'business',req.session.login_redirect||'/beta/login/redirect',function(user){
                // need to set a flag that this user let us manage pages
                user.can_manage_pages = true;
                user.save(function(){});
            });
        }
    },
    
    '/beta/logout' : {
        get : function(req, res){
            return req.session.destroy(function(){
                return res.redirect('/beta');
            });
        }
    },
    
    '/beta/login/redirect' :{
        get : {
            handler : function(req, res){
                var user = req.session.user,
                    page_id = req.session.page_id;
                
                if( !user ) throw Bozuko.error('bozuko/auth');
                
                req.session.beta_session = true;
                if( !page_id ){
                    
                    // wait... we should see if this dude can admin any places...
                    // has this person gone to a page before?
                    if( user.last_viewed_page && ~user.manages.indexOf( user.last_viewed_page ) ){
                        return res.redirect('/beta/page/'+user.last_viewed_page);
                    }
                    
                    return res.redirect('/beta/create-account');
                }
                
                return Bozuko.models.Page.findById( page_id, function(error, page){
                    if( error ) throw error;
                    if( !page || !~user.manages.indexOf(page) || !page.beta_agreement.signed ){
                        return res.redirect('/beta/agreement');
                    }
                    var redirect_url = '/beta/';
                    if( page_id ){
                        redirect_url += '/page/'+page_id;
                    }
                    return res.redirect( redirect_url );
                });
            }
        }
    },
    
    '/beta/create-account' : {
        
        access : 'user',
        
        locals : {
            head_scripts: [
                'https://ajax.googleapis.com/ajax/libs/jquery/1.6.1/jquery.min.js',
                '/js/desktop/beta/create-account.js'
            ]
        },
        
        get : {
            handler : function(req, res) {
                var user = req.session.user;
                // lets get this dudes pages.
                return Bozuko.service('facebook').get_user_pages(user, function(error, facebook_pages){
                    
                    if( error ) throw error;
                    
                    // lets get this dudes currently managed pages in Bozuko
                    return Bozuko.models.Page.find({_id:{$in:user.manages||[]}}, function(error, user_pages){
                        if( error ) throw error;
                        
                        var fids = [];
                        user_pages.forEach(function(page){
                            var fb = page.service('facebook');
                            if( fb ) fids.push(fb.sid);
                        });
                        
                        // filter out non-place pages...
                        var places = facebook_pages.filter(function(page){
                            if( page.location.lat === 0 && page.location.lng === 0 ) return false;
                            if( ~fids.indexOf(page.id) ) return false;
                            return true;
                        });
                        
                        var other_pages = facebook_pages.filter(function(page){
                            if( ~fids.indexOf(page.id) ) return false;
                            if( page.location.lat !== 0 && page.location.lng !== 0 ) return false;
                            return true;
                        });
                        
                        res.locals.places = places;
                        res.locals.user_pages = user_pages;
                        res.locals.other_pages = other_pages;
                        res.locals.facebook_pages_count = facebook_pages.length;
                        
                        return res.render('/beta/create-account');
                    
                    });
                });
            }
        },
        
        post : {
            handler : function(req, res){
                // get the place_id
                var user = req.session.user,
                    place_id = req.param('place_id');
                    
                if( !place_id ) throw "No Place ID passed";
                
                // get the place
                // lets get this dudes pages.
                return Bozuko.service('facebook').get_user_pages(user, function(error, facebook_pages){
                    if( error ) throw error;
                    
                    // make sure that this guy is indeed a facebook admin...
                    var facebook_page = null;
                    for(var i=0; i<facebook_pages.length && !facebook_page; i++){
                        if( facebook_pages[i].id == place_id ){
                            facebook_page = facebook_pages[i];
                        }
                    }
                    if( !facebook_page ) throw new Error("Not an admin...");
                    
                    // lets get this dudes currently managed pages in Bozuko
                    return Bozuko.models.Page.findByService('facebook', facebook_page.id, function(error, page){
                        if( error ) throw error;
                        
                        var emptyCb = function(x,cb){cb(null, page);};
                        
                        return (page ? emptyCb : Bozuko.models.Page.createFromServiceObject )(facebook_page, function(error, page){
                            if( error ) throw error;
                            
                            // okay, added..
                            return page.addAdmin(user, function(error){
                                if( error ) throw error;
                                // added as an admin... cool beans...
                                
                                if( Bozuko.env() == 'dashboard' ) Bozuko.require('util/mail').send({
                                    to: 'info@bozuko.com',
                                    subject: 'Someone create a new Page',
                                    body: [
                                        'Sweet Beav!',
                                        '',
                                        'Page:          '+page.name,
                                        'Facebook Page: '+page.service('facebook').data.link,
                                        'User:          '+user.name
                                    ].join('\n')
                                });
                                
                                
                                return res.redirect('/beta/page/'+page.id);
                            });
                            
                        });
                    
                    });
                });
                
            }
        }
    },
    
    '/beta/agreement': {
        get : {
            handler : function(req, res){
                if( req.param('token') ) return res.redirect('/beta/agreement');
                var user = req.session.user;
                if( !user ) throw Bozuko.error('bozuko/auth');
                
                // find out which page this dude manages
                return Bozuko.service('facebook').get_user_pages(user, function(error, pages){
                    if( error ){
                        throw error;
                    }
                    var ids = [];
                    pages.forEach(function(page){
                        ids.push(page.id);
                    });
                    /**
                     * TODO - remove the active flag, we probably need another one
                     */
                    var selector = {
                        $or : [
                            {'services.name':'facebook', 'services.sid':{$in:ids}},
                            {_id: {$in: user.manages}}
                        ]
                    };
                    if( req.session.page_id ){
                        selector._id = req.session.page_id;
                    }
                    return Bozuko.models.Page.findOne(selector,function(error, page){
                        if( error ) throw error;
                        if( !page ){
                            
                            // okay, now we are left
                            
                            return res.render('/beta/no-page');
                            
                            
                        }
                        if( page.beta_agreement.signed ){
                            req.session.page_id = page.id;
                            return page.addAdmin( user, function(error){
                                if( error ) throw error;
                                return res.redirect('/beta/page/'+page.id);
                            });
                        }
                        res.locals.page = page; 
                        res.locals.user = user;
                        res.locals.content = Content.get('beta/terms.md', 'Beta Terms of Use');
                        return res.render('/beta/agreement');
                    });
                });
            }
        },
        
        post : {
            handler : function(req, res){
                var user = req.session.user,
                    i=0, found,
                    page_id = req.param('page_id')
                    ;
                if( !req.session.user ) throw Bozuko.error('bozuko/auth');
                if( !page_id ) throw new Error('No page');
                
                
                Bozuko.models.Page.findById( page_id, function(error, page){
                    if( error ) throw error;
                    
                    // find out which page this dude manages
                    return Bozuko.service('facebook').get_user_pages(user, function(error, pages){
                        if( error ){
                            throw error;
                        }
                        var ids = [],
                            isAdmin = false;
                            
                        pages.forEach(function(page){
                            ids.push(String(page.id));
                        });
                        
                        isAdmin = ~ids.indexOf(String(page.service('facebook').sid));
                        if( !isAdmin && !~user.manages.indexOf(page._id) ){
                            throw new Error("You are not a manager");
                        }
                        page.beta_agreement = {
                            signed: true,
                            signed_by: user.id,
                            signed_date: new Date()
                        };
                        page.save( function(error){
                            if( error ) throw error;
                            page.addAdmin( user, function(error){
                                if( error ) throw error;
                                return res.redirect('/beta/page/'+page.id);
                            });
                        });
                    });
                });
            }
        }
    },
    '/beta/terms-of-use' : {
        get : {
            handler : function(req, res){
                res.locals.content = Content.get('beta/terms.md', 'Beta Terms of Use');
                if( req.header('x-requested-with') == 'XMLHttpRequest' ){
                    res.locals.layout = false;
                }
                res.render('site/content');
            }
        }
    }
    
};

Dashboard.addRoutes( exports, '/beta' );