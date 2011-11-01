// exports.access = 'admin';

exports.init = function(){
    //this.app.enable('jsonp callback');
};

exports.locals = {
    layout : '/client/layout',
    device : 'desktop'
};

exports.routes = {
    '/client' : {
        alias: '/client/*',
        get : {
            handler : function(req, res){
                res.locals.path = '/'+( req.params && req.params.length ? req.params[0] : 'api');
                return res.render('client/index');
            }
        }
    },
    '/client/login' : {
        get : {
            handler : function(req, res){
                
            }
        }
    }
};