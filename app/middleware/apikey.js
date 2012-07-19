module.exports = function apikey(){
    return function apikey(req, res, next){
        
        var api_key = req.param('api_key') || req.header('bozuko_api_key')
          , api_secret = req.param('api_secret') || req.header('bozuko_api_secret')
          , selector={}
          ;
        
        if(!api_key){
            return next();
        }
        
        console.log('how did i get here?');
        
        selector.key = api_key;
        if( api_secret ) selector.secret = api_secret;
        
        return Bozuko.models.Apikey.findOne(selector, function(error, key){
            if( !error && key ){
                if(api_secret){
                    key.setPrivate(true);
                }
                req.apikey = key;
                req.session.user = key;
                return next();
            }
            req.session.apikeyError = Bozuko.error('auth/developer');
            return next();
        });
    }
};