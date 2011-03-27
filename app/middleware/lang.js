module.exports = function lang(){
    
    return function lang(req, res, next){
        
        var LANG = req.query['lang'] || 'en';
        console.log(LANG);
        (function(){
            next();
        })();        
    }
};