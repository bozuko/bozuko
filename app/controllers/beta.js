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
    html_classes: [],
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
                    
                    res.locals.html_classes.push('beta-app');
                    res.locals.user = user;
                    res.locals.page = page;
                    res.locals.scripts.unshift(
                        '/js/ext-4.0/lib/ext-all-debug.js',
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
                res.render('site/content');
            }
        }
    },
    
    '/beta/winners' : {

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
    },
    
    '/beta/report' : {

        get : {
            handler : function(req, res){
                
                var user = req.session.user,
                    query = {
                        page_id: {$in: user.manages}
                    };
                
                return Report.run('counts',
                
                {
                    query: query,
                    model: req.param('model') || 'Entry',
                    from: DateUtil.add( new Date(), DateUtil.DAY, -6 )
                },
                
                function(error, results){
                    if( error ) return error.send( res );
                    return res.send( {items: results} );
                });
            }
        }
    },
    
    '/beta/pages' : {
        
        alias : '/beta/pages/:id',

        get : {
            handler : function(req, res){
                // need to get all pages
                var selector = {};
                selector._id = {$in: req.session.user.manages};
                if( req.param('id') ){
                    selector._id = req.param('id');
                }
                return Bozuko.models.Page.find(selector,{},{sort:{name:1}}, function(error, pages){
                    if( error ) return error.send(res);
                    return res.send({items:pages});
                });
            }
        },
        
        /* update */
        put : {
            handler : function(req,res){
                var user = req.session.user;
                
                if( !indexOf(user.manages, req.param('id')) ){
                    return Bozuko.error('bozuko/auth').send(res);
                }
                return Bozuko.models.Page.findById( req.param('id'), function(error, page){
                    if( error ) return error.send( res );
                    // else, lets bind the reqest to the page
                    var data = req.body;
                    
                    delete data._id;
                    page.set( data );
                    /**
                     * need to filter out non-updatabile fields
                     */
                    // filter(data)
                    return page.save( function(error){
                        if( error ) return error.send(res);
                        return res.send( {items: [page]} );
                    });
                })
            }
        }
    },
    
    '/beta/contests' : {
        
        alias : '/beta/contests/:id',
        /* Read */
        get : {
            handler : function(req, res){
                // need to get all pages
                var page_id = req.param('page_id'),
                    id = req.param('id'),
                    selector = {};

                if( page_id ) selector['page_id'] = page_id;
                if( id ) selector['_id'] = id;
                
                return Bozuko.models.Contest.find(selector,{},{sort:{active: -1, start:-1}}, function(error, contests){
                    if( error ) return error.send(res);
                    contests.sort(function(a,b){
                        if( a.state=='active' && b.state != 'active' ) return -1;
                        if( b.state=='active' && a.state != 'active' ) return 1;
                        return +b.start-a.start;
                    });
                    return res.send({items:contests});
                });
            }
        },
        /* Create */
        post : {
            handler : function(req, res){
                var data = filter(req.body),
                    prizes = data.prizes,
                    consolation_prizes = data.consolation_prizes;

                delete data._id;

                delete data.play_cursor;
                delete data.state;
                delete data.total_entries;
                delete data.total_plays;

                prizes.forEach(function(prize){
                    delete prize._id;
                });

                // any other _id things?
                consolation_prizes.forEach(function(prize){
                    delete prize._id;
                });

                var contest = new Bozuko.models.Contest(data);
                return contest.save( function(error){
                    if( error ) return error.send( res );
                    return res.send({items:[contest]});
                });
            }
        },
        /* Update */
        put : {
            handler : function(req, res){

                return Bozuko.models.Contest.findById(req.param('id'), function(error, contest){
                    if( error ) return error.send(res);

                    var data = filter(req.body);

                    var prizes = data.prizes,
                        entry_config = data.entry_config,
                        consolation_prizes = data.consolation_prizes;

                    delete data.prizes;
                    delete data.consolation_prizes;
                    delete data.state;
                    delete data.entry_config;

                    // most definitely do not want to touch this
                    delete data.play_cursor;
                    delete data.token_cursor;

                    // don't want to update this, will throw an error
                    delete data._id;

                    for( var p in data ){
                        if( data.hasOwnProperty(p) ){
                            contest.set(p, data[p] );
                        }
                    }

                    prizes.forEach(function(prize, i){
                        var old, doc;
                        if( prize._id && (old = contest.prizes.id(prize._id)) ){
                            doc = old.doc;
                            for( var p in prize ){
                                if( prize.hasOwnProperty(p) ){
                                    doc[p] = prize[p];
                                }
                            }
                            prizes[i] = doc;
                        }
                    });

                    consolation_prizes.forEach(function(consolation_prize, i){
                        var old, doc;
                        if( consolation_prize._id && (old = contest.consolation_prizes.id(consolation_prize._id)) ){
                            doc = old.doc;
                            for( var p in consolation_prize ){
                                if( consolation_prize.hasOwnProperty(p) ){
                                    doc[p] = consolation_prize[p];
                                }
                            }
                            consolation_prizes[i] = doc;
                        }
                    });

                    // no clue why i have to do this right now...
                    contest.prizes = [];
                    contest.consolation_prizes = [];
                    contest.entry_config = [];

                    // save existing prizes before adding and removing others
                    return contest.save(function(error){

                        if( error ) return error.send( res );
                        prizes.forEach( function(prize){
                            if( !prize._id ) delete prize._id;
                            contest.prizes.push(prize);
                        });
                        consolation_prizes.forEach( function(prize){
                            if( !prize._id ) delete prize._id;
                            contest.consolation_prizes.push(prize);
                        });

                        entry_config.forEach( function(config){
                            contest.entry_config.push( config );
                        });

                        return contest.save( function(error){
                            if( error ){
                                console.log(error);
                                return error.send( res );
                            }
                            return Bozuko.models.Contest.findById( contest.id, function(error, contest){
                                if( error ) return error.send( res );
                                return res.send( {items: [contest]} );
                            });
                        });
                    });
                });
            }
        },
        /* Delete */
        del : {
            // delete the record
            handler : function(req,res){
                return Bozuko.models.Contest.findById(req.param('id'), function(error, contest){
                    if( error ) return error.send(res);
                    if( !contest ){
                        return res.send({success: true});
                    }
                    return contest.remove(function(error){
                        if( error ) return error.send(res);
                        // success
                        return res.send({success: true});
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