var auth = require('../auth');
var testsuite = require('./config/testsuite');

var fb_user = {
    service: 'facebook',
    id: '32423432523',
    name: 'Charlie Sheen',
    first_name: 'Charlie',
    last_name: 'Sheen',
    email: 'cs@winning.com',
    token: 'dfasaa33345353453543',
    gender: 'male'
};

/**
 *  Mock req and res objects
 */
var req = {
    session: {
        phone: {
            type: 'iphone',
            unique_id: '12412412'
        },
        mobile_version: '1.0'
    }
};

var new_phone = {
    type: 'iphone',
    unique_id: '11111111'
};

var res = {
    send: function() {}
};

exports['Add Facebook user'] = function(test) {
    Bozuko.models.User.addOrModify(fb_user, req.session.phone, function(err, u) {
        test.ok(!err);
        test.equal(u.services.length, 1);

        // Add user to the session
        req.session.user = u;

        // Correctly calculate the challenge response
        req.session.challenge_response = auth.mobile_algorithms['1.0'](u.challenge);

        test.done();
    });
};

exports['authorize user'] = function(test) {
    authorize(test, 'user', true);
};

exports['authorize user - fail'] = function(test) {
    req.session.old_user = req.session.user;
    req.session.user = false;
    authorize(test, 'user', false);
};

exports['authorize mobile'] = function(test) {
    req.session.user = req.session.old_user;
    authorize(test, 'mobile', true);
};

exports['authorize mobile - fail - type mismatch'] = function(test) {
    req.session.phone.type = 'android';
    authorize(test, 'mobile', false);
};

exports['authorize mobile - fail - bad version'] = function(test) {
    req.session.phone.type = 'iphone';
    req.session.mobile_version = 'bad version';
    authorize(test, 'mobile', false);
};

exports['authorize mobile - fail - bad challenge response'] = function(test) {
    req.session.mobile_version = '1.0';
    req.session.challenge_response = 'bad value';
    authorize(test, 'mobile', false);
};

exports['authorize mobile - fail - new phone which isn\'t in session'] = function(test) {
    req.session.phone = new_phone;
    authorize(test, 'mobile', false);
};

exports.cleanup = function(test) {
    Bozuko.models.User.remove({}, function() {
        test.done();
    });
};

function authorize(test, access, success) {
   // If auth.check fails, the callback will not be called. We should clean up the test.
    var timeout = setTimeout(function() {
        test.ok(!success);
        test.done();
    }, 100);

    var check_user = auth.check(access, function(req, res) {
        clearTimeout(timeout);
        test.ok(success);
        test.done();
    });

    check_user(req, res);
}