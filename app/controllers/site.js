
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
        link: '#',
        text: 'Bozuko for Business'
    }],
    scripts:[
        '/js/desktop/get-satisfaction.js'
    ]
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
    }
};