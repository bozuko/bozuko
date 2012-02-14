var burl = Bozuko.require('util/url').create;

module.exports = function poweredby(){
    return function locals(req, res, next){
        var host = Bozuko.cfg('server.host'),
            port = Bozuko.cfg('server.port'),
            header = req.header('host')
            ;
        
        if( !~[443,80].indexOf(port) ) {
            host+=(':'+port);
        }
        if( header && header != host ){
            return res.redirect(burl(req.url));
        }
        return next();
    }
};