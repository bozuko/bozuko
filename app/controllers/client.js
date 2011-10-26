exports.access = 'admin';

exports.init = function(){
    this.app.enable('jsonp callback');
};

exports.locals = {
    layout : '/client/layout',
    device : 'desktop'
};

exports.routes = {
    '/client' : {
        get : {
            handler : function(req, res){
                return res.render('client/index');
            }
        }
    }
};