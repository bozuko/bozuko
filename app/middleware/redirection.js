var burl = Bozuko.require('util/url').create;

module.exports = function redirection(){
    return function redirection(req, res, next){
        
        var host = Bozuko.cfg('server.host'),
            port = Bozuko.cfg('server.port'),
            header = req.header('host')
            ;
        
        if( req.param('mobile_version') ) return next();
        
        if( !~[443,80].indexOf(port) ) {
            host+=(':'+port);
        }
        if( header && header != host ){
            return res.redirect(burl(req.url));
        }
        return next();
    }
};