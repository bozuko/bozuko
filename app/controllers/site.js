
exports.locals = {
    layout: 'site/layout',
    title: 'Bozuko'
};

exports.routes = {
    '/' : {
        get : {
            handler: function(req, res) {
                res.render('site/index');
            }
        }
    }
};