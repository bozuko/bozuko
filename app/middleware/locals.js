module.exports = function locals(){
    return function locals(req, res, next){
        req.locals = {
            user            :req.session.user||false
        };
        next();
    }
};