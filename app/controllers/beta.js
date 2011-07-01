var Content = Bozuko.require('util/content'),
    validator = require('validator'),
    mailer = Bozuko.require('util/mail'),
    crypto = require('crypto');

exports.locals = {
    home_link: '/beta',
    home_title: 'Bozuko Beta',
    layout: 'beta/layout',
    title: 'Bozuko Beta',
    meta: {
        'charset':'utf-8',
        'author':'Bozuko Inc.',
        'description': 'Bozuko Beta Customer Area.',
        'robots' : 'noindex,nofollow'
    },
    nav: [],
    head_scripts: [
        
    ],
    scripts: [
        
    ],
    styles: [
        '/css/desktop/style.css',
        '/css/desktop/layout.css',
        '/css/desktop/beta/style.css'
    ]
};

exports.init = function(){
    
};

exports.routes = {
    '/beta/(page/:page_id)?' : {
        get : {
            handler : function(req, res){
                var user = req.session.user,
                    page_id = req.param('page_id');
                
                if( !user ){
                    if( req.param('page_id') ){
                        req.session.page_id = page_id;
                    }
                    else{
                        req.session.page_id = false;
                    }
                    return res.render('beta/welcome');
                }
                
                var selector = {};
                if( req.param('page_id') ) selector._id = page_id;
                else{ req.session.page_id = false; }
                
                return user.getManagedPages(selector, function(error, pages){
                    if( error ) throw error;
                    
                    if( !pages.length ){
                        return res.render('beta/welcome');
                    }
                    
                    console.log('pages.length:'+pages.length);
                    
                    var signed = false,
                        page;
                        
                    while( !signed && pages.length ){
                        page = pages.pop();
                        signed = page.beta_agreement.signed;
                    }
                    if( !signed ){
                        req.session.page_id = page.id;
                        // use the last page...
                        return res.render('beta/welcome');
                    }
                    
                    res.locals.user = user;
                    res.locals.page = page;
                    res.locals.scripts.unshift(
                        '/js/ext-4.0/lib/ext-all.js',
                        '/js/desktop/beta/app.js'
                    );
                    res.locals.styles.unshift(
                        '/js/ext-4.0/lib/resources/css/ext-all-gray.css',
                        '/js/desktop/business/style.css'
                    );
                    return res.render('beta/index');
                });
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
                
                if( !page_id ) return res.redirect('/beta/agreement');
                return Bozuko.models.Page.findById( page_id, function(error, page){
                    if( error ) throw error;
                    if( !page || !page.beta_agreement.signed ){
                        return res.redirect('/beta/agreement');
                    }
                    return res.redirect('/beta');
                    
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
                    var selector = {'services.name':'facebook', 'services.sid':{$in:ids}};
                    if( req.session.page_id ){
                        selector._id = req.session.page_id;
                    }
                    console.log(selector);
                    return Bozuko.models.Page.findOne(selector,function(error, page){
                        if( error ) throw error;
                        if( !page ){
                            return res.render('beta/no-page');
                        }
                        res.locals.page = page; 
                        res.locals.user = user;
                        res.locals.content = Content.get('beta/terms.md', 'Beta Terms of Use');
                        return res.render('beta/agreement');
                    });
                });
            }
        },
        
        post : {
            handler : function(req, res){
                /**
                 * TODO - get page_id from request and then make
                 * the user the owner before saving.
                 */
                var user = req.session.user,
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
                        if( !isAdmin ){
                            throw new Error("You are not a manager");
                        }
                        
                        page.admins.push( user.id );
                        page.beta_agreement = {
                            signed: true,
                            signed_by: user.id,
                            signed_date: new Date()
                        };
                        page.save(function(error){
                            if( error ) throw error;
                            return req.session.user.save(function(error){
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
                res.render('site/content');
            }
        }
    }
};

function getToken(session, forceNew){
    var token;
    if( !session.token || forceNew ){
        session.token = crypto.createHash('sha1')
            .update( session.id + (new Date().getTime()) )
            .digest('hex');
    }
    return session.token;
}