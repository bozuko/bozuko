var testsuite = require('./config/testsuite');

var fb_user = {
    id: '32423432523',
    service: 'facebook',
    name: 'Charlie Sheen',
    first_name: 'Charlie',
    last_name: 'Sheen',
    email: 'cs@winning.com',
    gender: 'male'
};

var fs_user = {
    id: '12345',
    service: 'foursquare',
    first_name: 'Charlie',
    last_name: 'Sheen',
    email: 'cs@winning.com',
    gender: 'male',
    token: '325252fadf'
};

exports['Add Facebook user'] = function(test) {
    Bozuko.models.User.addOrModify(fb_user, null, function(err, u) {
        test.ok(!err);
        test.equal(u.services.length, 1);
        test.done();
    });
};

exports['Add Foursquare user'] = function(test) {
    Bozuko.models.User.addOrModify(fs_user, null, function(err, u) {
        test.ok(!err);
        test.equal(u.services.length, 2);
        test.done();
    });
};

exports.cleanup = function(test) {
    Bozuko.models.User.remove({}, function() {
        test.done();
    });
};
