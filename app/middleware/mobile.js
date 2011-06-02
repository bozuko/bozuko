var version_compare = Bozuko.require('util/version').compare;

module.exports = function mobile() {
    return function mobile(req, res, next) {

        var phone = {};
        var val;

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
        
        if( req.session.mobile_version && phone.type ){
            
            // lets check this against our
            var key = phone.type.toLowerCase();
            
            if( /iphone/i.test(key) ) key = 'iphone';
            else if(/android/i.test(key) ) key = 'android';
            
            var mob = Bozuko.config.client.mobile;
            
            var client = mob[key] || mob['iphone'];
            
            if( version_compare(req.session.mobile_version, client.min_version) == -1 ){
                // force an update
                return Bozuko.error('bozuko/update').send(res);
            }
        }

        return next();
    };
};