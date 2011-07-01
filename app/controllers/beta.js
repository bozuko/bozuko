var Content = Bozuko.require('util/content'),
    validator = require('validator'),
    mailer = Bozuko.require('util/mail'),
    indexOf = Bozuko.require('util/functions').indexOf,
    filter = Bozuko.require('util/functions').filter,
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
                if( req.param('page_id') ){
                    selector._id = page_id;
                }
                else{
                    req.session.page_id = false;
                }
                return user.getManagedPages(selector, function(error, pages){
                    if( error ) throw error;
                    
                    if( !pages.length ){
                        return res.render('beta/welcome');
                    }
                    
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
                        '/css/desktop/business/style.css',
                        '/css/desktop/admin/app.css'
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
                if( !page_id ){
                    return res.redirect('/beta/agreement');
                }
                
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
                    return Bozuko.models.Page.findOne(selector,function(error, page){
                        if( error ) throw error;
                        if( !page ){
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
                        if( !isAdmin ){
                            throw new Error("You are not a manager");
                        }
                        page.beta_agreement = {
                            signed: true,
                            signed_by: user.id,
                            signed_date: new Date()
                        };
                        page.addAdmin( user, function(error){
                            if( error ) throw error;
                            return res.redirect('/beta/page/'+page.id);
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
    },
    
    '/admin/winners' : {

        get : {
            handler : function(req, res){
                // check for contest or page
                var contest_id = req.param('contest_id'),
                    page_id = req.param('page_id'),
                    limit = req.param('limit') || 25,
                    offset = req.param('offset') || 0,
                    updateOnly = req.param('updateOnly') || false,
                    user = req.session.user,
                    selector = {page_id: {$in: user.manages}}
                    ;
                    
                console.log(selector);

                if( contest_id ){
                    selector['contest_id'] = contest_id;
                }
                if( page_id && ~indexOf(user.manages, page_id) ){
                    selector['page_id'] = page_id;
                }

                return Bozuko.models.Prize.getLastUpdated(selector, function(error, lastUpdated){
                    if( error ) return error.send( res );

                    return Bozuko.models.Prize.find(selector, {}, {sort: {last_updated: -1}, limit: limit, skip: offset},function(error, prizes){
                        if( error ) return error.send(res);

                        var user_ids = {};
                        prizes.forEach(function(prize){
                            user_ids[String(prize.user_id)] = true;
                        });
                        var page_ids = {};
                        prizes.forEach(function(prize){
                            page_ids[String(prize.page_id)] = true;
                        });
                        var contest_ids = {};
                        prizes.forEach(function(prize){
                            contest_ids[String(prize.contest_id)] = true;
                        });

                        // get the users
                        return Bozuko.models.User.find({_id: {$in: Object.keys(user_ids)}}, function(error, users){
                            if( error ) return error.send(res);
                            var user_map = {};
                            users.forEach(function(user){
                                user_map[String(user._id)] = user;
                            });

                            // get the pages
                            return Bozuko.models.Page.find({_id: {$in: Object.keys(page_ids)}}, {name: 1, image: 1}, function(error, pages){

                                var page_map = {};
                                pages.forEach(function(page){
                                    page_map[String(page._id)] = page;
                                });
                                // get the contests
                                return Bozuko.models.Contest.find({_id: {$in: Object.keys(contest_ids)}}, {name: 1}, function(error, contests){

                                    var contest_map = {};
                                    contests.forEach(function(contest){
                                        contest_map[String(contest._id)] = contest;
                                    });

                                    var winners = [];
                                    prizes.forEach(function(prize){
                                        // create a winner object
                                        winners.push({
                                            _id: prize.id,
                                            prize: filter(prize,'_id','timestamp','state','name','description','details','instructions','redeemed_time','expires','redeemed','consolation','is_barcode','is_email','email_code','barcode_image', 'last_updated'),
                                            user: filter(user_map[String(prize.user_id)],'_id','name','image','email'),
                                            page: filter(page_map[String(prize.page_id)], '_id', 'name','image'),
                                            contest: filter(contest_map[String(prize.contest_id)], '_id', 'name')
                                        });
                                    });
                                    return res.send({items:winners, last_updated: lastUpdated?filter(lastUpdated,'_id','last_updated'):null});
                                });
                            });
                        });
                    });
                });
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