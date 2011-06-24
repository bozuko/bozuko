var version_compare = Bozuko.require('util/version').compare;

module.exports = function location() {
    return function location(req, res, next) {

        if( !req.session ) return next();
        
        // we need to process the entry
        var ll = req.param('ll');
        if( !ll ){
            return next();
        }
        var parts = ll.split(',');
        if( parts.length != 2 ){
            return next();
        }
        parts.reverse();
        parts[0] = parseFloat( parts[0] );
        parts[1] = parseFloat( parts[1] );
        req.session.location = parts;
        if( req.session.user ) req.session.user.location = parts;
        return next();
    };
};