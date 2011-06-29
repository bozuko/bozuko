var Content = Bozuko.require('util/content'),
    validator = require('validator'),
    mailer = Bozuko.require('util/mail'),
    crypto = require('crypto');

exports.locals = {
    layout: 'site/layout',
    title: 'Bozuko',
    meta: {
        'google-site-verification': 'HCG8QvNiMF-A93y538WBwu-r3dpkPYAIyfE72RpF7Cs',
        'description': 'Bozuko is the most exciting way to win prizes at your favorite places. Download and play today!',
        'robots' : 'noindex,nofollow',
        'keywords':[
            'instant win',
            'games',
            'geolocation',
            'android',
            'iphone',
            'game of chance',
            'lucky',
            'prizes'
        ]
    },
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
    
};

exports.routes = {
    
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