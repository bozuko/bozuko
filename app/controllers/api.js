var alias = Bozuko.require('core/alias');

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
    
    '/:page_alias/:contest_alias':{
        
        aliases: ['/:page_alias'],
        get : {
            handler : function(req, res, next){
                
                return alias.find( req.path, function(error, found){
                    if( error || !found|| !found.game) return next();
                    if( !Bozuko.controllers.Client ){
                        console.log('Please enable the Client controller');
                        return next();
                    }
                    return Bozuko.controllers.Client.renderGame(req, res, found.game._id);
                });
            }
        }
    }
};