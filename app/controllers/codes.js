var validator   = require('validator'),
BozukoError = Bozuko.require('core/error');
;

exports.locals = {
    home_link: '/codes',
    home_title: 'Code Search',
    device: 'desktop',
    title: 'Code Search',
    layout: 'codes/layout',
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
        'https://fonts.googleapis.com/css?family=Open+Sans:300italic,400italic,600italic,700italic,800italic,400,800,700,600,300',
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
    if (res.locals.error_ctx && res.locals.error_ctx === 'search') {
        return res.render('codes/search.jade', err);
    }
    res.render('codes/pin.jade');
}

var not_found = 'Sorry, no prizes were found.';
function render(res) {
    res.locals.error_ctx = 'search';
    return Bozuko.models.User.findById(res.locals.prize.user_id, function(err, user) {
        if (err) return error(res, err);
        if (!user) return error(res, not_found);
        res.locals.user_image = user.image;
        res.locals.user_name = user.name;
        return Bozuko.models.Contest.findById(res.locals.prize.contest_id, function(err, contest) {
            if (err) return error(res, err);
            if (!contest) return error(res, not_found);
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
                var page_name = req.param('page_name');

                if (!pin) return res.render('codes/pin.jade');
                if (!page_id || !page_name) {
                    return Bozuko.models.Page.verifyPin(pin, function(err, page) {
                        if (err) return error(res, err);
                        res.locals.pin = pin;
                        res.locals.page_id = page._id;
                        res.locals.page_name = page.name;
                        return res.render('codes/search.jade');
                    });
                }
                res.locals.error_ctx = 'search';
                res.locals.pin = pin;
                res.locals.page_id = page_id;
                res.locals.page_name = page_name;
                return Bozuko.models.Prize.findOne({code: code, page_id: page_id}, function(err, prize) {
                    if (err) return error(res, err);
                    if (!prize) return error(res, not_found);
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
                var pin = req.param('pin');
                var page_id = req.param('page_id');
                var page_name = req.param('page_name');

                if (!pin) return res.render('codes/pin.jade');
                if (!page_id || !page_name) {
                    return Bozuko.models.Page.verifyPin(pin, function(err, page) {
                        if (err) return setTimeout(function() {error(res, err);}, 3000);
                        res.locals.pin = pin;
                        res.locals.page_id = page._id;
                        res.locals.page_name = page_name;
                        return res.render('codes/search.jade');
                    });
                }
                res.locals.error_ctx = 'search';
                res.locals.pin = pin;
                res.locals.page_id = page_id;
                res.locals.page_name = page_name;
                return Bozuko.models.Prize.findOne({code: code, page_id:  page_id}, function(err, prize) {
                    if (err) return error(res, err);
                    if (!prize) return error(res, not_found);
                    res.locals.code = code;
                    return prize.verify(function(err, newPrize) {
                        if (err) return error(res, err);
                        if (!newPrize) return error(res, not_found);
                        res.locals.prize = newPrize;
                        return render(res);
                    });
                });
            }
        }
    }
};
