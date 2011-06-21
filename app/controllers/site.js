
exports.locals = {
    layout: 'site/layout',
    title: 'Bozuko',
    nav: [{
        link: '/',
        text: 'Home'
    },{
        link: '#',
        text: 'How to Play'
    },{
        link: '#',
        text: 'Bozuko for Business'
    }]
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
    }
};