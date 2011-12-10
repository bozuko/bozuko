var validator   = require('validator')
;

exports.locals = {
    home_link: '/codes',
    home_title: 'Code Search',
    device: 'desktop',
    title: 'Code Search',
    hide_top_profile: true,
    meta: {
        'charset':'utf-8',
        'author':'Bozuko Inc.',
        'robots':'noindex,nofollow',
        'google-site-verification': 'HCG8QvNiMF-A93y538WBwu-r3dpkPYAIyfE72RpF7Cs',
        'description': 'Bozuko is the most exciting way to win prizes at your favorite places. Download and play today!',
        'keywords':[
            'instant win',
            'games',
            'geolocation',
            'android',
            'iphone',
            'game of chance',
            'lucky',
            'prizes'
        ],
        "og:image": "https://bozuko.com/images/profile-picture.png"
    },
    styles: [
        '/css/desktop/style.css?'+Date.now(),
        '/css/desktop/layout.css?'+Date.now(),
        '/css/desktop/beta/style.css?'+Date.now(),
        '/css/desktop/codes.css?'+Date.now()
    ]
};
var inspect = require('util').inspect;
exports.routes = {
    '/codes': {
        get: {
            handler: function(req, res) {
                return res.render('codes/index.jade');
            }
        },

        post: {
            handler: function(req, res) {
                var code = req.param('code');
                return Bozuko.models.Prize.findOne({code: code}, function(err, prize) {
                    if (err) return err.send(res);
                    if (!prize) return res.render('codes/not_found.jade');
                    res.locals.code = code;
                    res.locals.prize = prize;
                    return Bozuko.models.User.findById(prize.user_id, function(err, user) {
                        if (err) return err.send(res);
                        if (!user) return res.render('codes/not_found.jade');
                        res.locals.user_image = user.image;
                        return Bozuko.models.Contest.findById(prize.contest_id, function(err, contest) {
                            if (err) return err.send(res);
                            if (!contest) return res.render('codes/not_found.jade');
                            res.locals.contest = contest;
                            return res.render('codes/prizes.jade');
                        });
                    });
                });
            }
        }
    }
};
