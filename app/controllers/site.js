
exports.locals = {
    layout: 'site/layout',
    title: 'Site'
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