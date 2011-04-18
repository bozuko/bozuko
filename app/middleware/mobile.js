module.exports = function mobile() {
    return function mobile(req, res, next) {

        var phone = {};
        var val;
        if (val = req.param('phone_id')) {
            phone.id = val;
        }
        if (val = req.param('phone_type')) {
            phone.type = val;
        }

        if (val = req.param('mobile_version')) {
            req.session.mobile_version = val;
        }

        if (val = req.param('challenge_response')) {
            req.session.challenge_response = val;
        }

        if (phone.id && phone.type) {
            req.session.phone = phone;
        }

    };
};
