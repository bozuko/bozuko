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
                var user = req.session.user;
                
                if( !user || !user.beta_agreement.signed ){
                    if( req.param('page_id') ){
                        req.session.page_id = req.param('page_id');
                    }
                    return res.render('beta/welcome');
                }
                
                return Bozuko.models.Page.findOne({owner_id: user.id}, function(error, page){
                    if( error ) throw error;
                    if( !page ){
                        return res.render('beta/no-page');
                    }
                    res.locals.user = user;
                    res.locals.page = page;
                    res.locals.scripts.unshift(
                        '/js/ext-4.0/lib/ext-all.js',
                        '/js/desktop/beta/app.js'
                    );
                    res.locals.styles.unshift('/js/ext-4.0/lib/resources/css/ext-all-gray.css');
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
                var user = req.session.user;
                if( !user ) throw Bozuko.error('bozuko/auth');
                
                if( user.beta_agreement.signed ) return res.redirect('/beta');
                return redirect('/beta/agreement');
            }
        }
    },
    
    '/beta/agreement': {
        get : {
            handler : function(req, res){
                if( req.param('token') ) return res.redirect('/beta/agreement');
                var user = req.session.user;
                if( !user ) throw Bozuko.error('bozuko/auth');
                
                if( user.beta_agreement.signed ) return res.redirect('/beta/terms-of-use');
                
                // find out which page this dude manages
                return Bozuko.service('facebook').get_user_pages(user, function(error, pages){
                    if( error ){
                        throw error;
                    }
                    var ids = [];
                    pages.forEach(function(page){
                        ids.push(page.id);
                    });
                    return Bozuko.models.Page.findOne({'services.name':'facebook', 'services.sid':{$in:ids}},function(error, page){
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
                        page.owner_id = user.id;
                        page.save(function(error){
                            if( error ) throw error;
                            req.session.user.beta_agreement.signed = true;
                            return req.session.user.save(function(error){
                                if( error ) throw error;
                                return res.redirect('/beta');
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