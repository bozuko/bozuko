var Content = Bozuko.require('util/content');


exports.locals = {
    layout: 'site/layout',
    title: 'Bozuko',
    nav: [{
        link: '/',
        text: 'Home'
    },{
        link: '/how-to-play',
        text: 'How to Play'
    },{
        link: '/bozuko-for-business',
        text: 'Bozuko for Business'
    }],
    scripts:[
    ]
};

exports.init = function(){
    var self = this;
    this.app.use(function(req,res){
        self.refs.notFound(req,res);
    });
};

exports.routes = {
    '/' : {
        get : {
            
            title: 'Welcome to Bozuko!',
            locals: {
                html_classes: ['site-home'],
                head_scripts: []
            },
            
            handler: function(req, res) {
                res.render('site/index');
            }
        }
    },
    '/how-to-play' : {
        get : {
            
            title: 'How to Play Bozuko',
            locals: {
                html_classes: ['site-how-to-play'],
                head_scripts: [
                    'https://ajax.googleapis.com/ajax/libs/jquery/1.6.1/jquery.min.js',
                    '/js/desktop/site/how-to.js'
                ]
            },
            
            handler: function(req, res) {
                res.render('site/how-to-play');
            }
        }
    },
    '/bozuko-for-business' : {
        get : {
            
            title: 'Bozuko for Business',
            locals: {
                html_classes: ['site-b4b'],
                head_scripts: [
                    'https://ajax.googleapis.com/ajax/libs/jquery/1.6.1/jquery.min.js',
                    '/js/desktop/site/b4b.js'
                ]
            },
            
            handler: function(req, res) {
                res.render('site/bozuko-for-business');
            }
        }
    },
    '/p/:id' : {
        get : {
            
            title: 'Bozuko Business Listing',
            locals: {
                html_classes: ['site-business-page'],
                head_scripts: [
                    
                ]
            },
            
            handler: function(req, res) {
                return Bozuko.models.Page.findById( req.param('id'), function(error, page){
                    if( error || !page ){
                        res.locals.page = null;
                        return res.render('site/business-page');
                    }
                    // lets get the contests too
                    res.locals.page = page;
                    return page.loadContests(null, function(error, contests){
                        res.locals.contests = contests;
                        return res.render('site/business-page');
                    });
                });
            }
        }
    },
    '404' : {
        get : {
            ref: 'notFound',
            
            title :'Bozuko | Page not found',
            
            locals: {
                html_classes: [
                    'cityscape'
                ]
            },
            
            handler: function(req, res){
                return res.render('site/404', 404);
            }
        }
    },
    '/privacy-policy' : {
        get : {
            title :'Bozuko Privacy Policy',
            
            locals: {
                html_classes: [
                    'legal'
                ],
                content: Content.get('site/privacy.md')
            },
            
            handler: function(req, res){
                res.locals.content = Content.get('site/privacy.md');
                return res.render('site/content', 404);
            }
        }
    },
    
    '/terms-of-use' : {
        get : {
            title :'Bozuko Terms of Use',
            
            locals: {
                html_classes: [
                    'legal'
                ],
                content: Content.get('site/terms.md')
            },
            
            handler: function(req, res){
                res.locals.content = Content.get('site/terms.md');
                return res.render('site/content', 404);
            }
        }
    }
};