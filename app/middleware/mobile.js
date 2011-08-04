var version_compare = Bozuko.require('util/version').compare;

module.exports = function mobile() {
    return function mobile(req, res, next) {

        var phone = {};
        var val;
        
        if( !req.session ) return next();

        // clear old info
        ['phone','mobile_version','challenge_response'].forEach(function(key){
            if( req.session && req.session[key]) delete req.session[key];
        });

        if ( (val = req.param('phone_id')) ) {
            phone.unique_id = val;
        }
        if ( (val = req.param('phone_type')) ) {
            phone.type = val;
        }

        if ( (val = req.param('mobile_version')) ) {
            req.session.mobile_version = val;
        }

        if ( (val = req.param('challenge_response')) ) {
            req.session.challenge_response = val;
        }

        if (phone.unique_id && phone.type) {
            req.session.phone = phone;
        }
        
        if( req.session.mobile_version ){
            
            var parts = req.session.mobile_version.split('-', 2);
            
            if( parts.length === 1 ) parts.unshift('iphone');
            
            var key = parts[0],
                version = parts[1],
                mob = Bozuko.config.client.mobile,
                client = mob[key] || mob['iphone'];
            
            if( version_compare(version, client.min_version) == -1 ){
                // force an update
                return Bozuko.error('bozuko/update').send(res);
            }
            
            if( req.session.user ){
                req.session.user.phone = key;
            }
            
        }

        return next();
    };
};