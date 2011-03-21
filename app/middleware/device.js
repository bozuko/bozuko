module.exports = function device(){
    return function device(req, res, next){
        if( req.query['device'] ){
            req.session.device = req.query['device'];
        }
        else if( req.session && !req.session.device ){
            req.session.device = req.monomi.browserType;
        }
        next();
    }
};