var validator   = require('validator'),
BozukoError = Bozuko.require('core/error');
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

function error(res, err) {
    if (err instanceof BozukoError) {
        res.locals.error = err.message;
    } else {
        res.locals.error = err;
    }
    res.render('codes/error.jade', err);
}

function render(res) {
    return Bozuko.models.User.findById(res.locals.prize.user_id, function(err, user) {
        if (err) return error(res, err);
        if (!user) return res.render('codes/not_found.jade');
        res.locals.user_image = user.image;
        return Bozuko.models.Contest.findById(res.locals.prize.contest_id, function(err, contest) {
            if (err) return error(res, err);
            if (!contest) return res.render('codes/not_found.jade');
            res.locals.contest = contest;
            return res.render('codes/prizes.jade');
        });
    });
}

exports.routes = {
    '/codes': {
        get: {
            handler: function(req, res) {
                return res.render('codes/pin.jade');
            }
        },

        post: {
            handler: function(req, res) {
                var code = req.param('code');
                var pin = req.param('pin');
                var page_id = req.param('page_id');
                if (!pin) return res.render('codes/pin.jade');
                if (!page_id) {
                    return Bozuko.models.Page.verifyPin(pin, function(err, page) {
                        if (err) return error(res, err);
                        res.locals.pin = pin;
                        res.locals.page_id = page._id;
                        return res.render('codes/index.jade');
                    });
                }
                res.locals.pin = pin;
                res.locals.page_id = page_id;
                return Bozuko.models.Prize.findOne({code: code, page_id: page_id}, function(err, prize) {
                    if (err) return error(res, err);
                    if (!prize) return res.render('codes/not_found.jade');
                    res.locals.code = code;
                    res.locals.prize = prize;
                    return render(res);
                });
            }
        }
    },

    '/codes/verified': {
        post: {
            handler: function(req, res) {
                var code = req.param('code');
                return Bozuko.models.Prize.findOne({code: code}, function(err, prize) {
                    if (err) return error(res, err);
                    if (!prize) return res.render('codes/not_found.jade');
                    res.locals.code = code;
                    return prize.verify(function(err, newPrize) {
                        if (err) return error(res, err);
                        if (!newPrize) return res.render('codes/not_found.jade');
                        res.locals.prize = newPrize;
                        return render(res);
                    });
                });
            }
        }
    }
};
