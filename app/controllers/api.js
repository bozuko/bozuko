exports.session = false;

exports.routes = {
    '/api' : {
        get : {
            handler: function(req, res) {
                var links = {
                    pages: "/pages",
                    bozuko: "/bozuko"
                };
                if (req.session.user) {
                    links.user = "/user",
                    links.prizes = "/prizes";
                } else {
                    links.login = "/user/login";
                }
                return Bozuko.transfer('entry_point', {links: links}, null, function(error, result){
                    if (error) return error.send(res);
                    return res.send( result );
                });
            }
        }
    },
    
    '/:alias':{
        get : {
            handler : function(req, res, next){
                var self = this,
                    alias = req.param('alias');
                
                if( ~alias.indexOf('/') ) return next();
                return Bozuko.models.Contest.find({alias: alias}, {results: 0, page: 0}, {limit: 1}, function(error, contests){
                    
                    if( error || !contests.length ) return next();
                    
                    if( Bozuko.controllers.Client ){
                        return Bozuko.controllers.Client.renderGame(req, res, contests[0]);
                    }
                    return next();
                });
            }
        }
    }
};