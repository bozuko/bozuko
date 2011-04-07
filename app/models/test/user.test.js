var testsuite = require('./config/testsuite');

var fb_user = {
    id: '32423432523',
    name: 'Charlie Sheen',
    first_name: 'Charlie',
    last_name: 'Sheen',
    email: 'cs@winning.com',
    token: 'dfasaa33345353453543',
    gender: 'male'
};

var fs_user = {
    id: '12345',
    firstName: 'Charlie',
    lastName: 'Sheen',
    contact: {
        email: 'cs@winning.com'
    },
    gender: 'male',
    token: '325252fadf'
};

var phone1 = {
    type: 'iphone',
    id: '323423423423'
};

var phone1_android = {
    type: 'android',
    id: '323423423423'
};

exports['Add Facebook user'] = function(test) {
    Bozuko.models.User.addOrModify(fb_user, phone1, 'facebook', function(err, u) {
        test.ok(!err);
        test.equal(u.phones.length, 1);
        test.equal(u.services.length, 1);
        test.done();
    });
};

exports['Change phone type for Facebook user'] = function(test) {
    Bozuko.models.User.addOrModify(fb_user, phone1_android, 'facebook', function(err, u) {
        test.ok(err);
        Bozuko.models.User.findOne({'services.name': 'facebook', 'services.sid': fb_user.id}, function(err, user) {
            test.ok(!err);
            test.ok(user);
            test.equal(user.phones.length, 1);
            test.equal(user.services.length, 1);
            test.deepEqual(user.phones[0].type, phone1.type);
            test.done();
        });
    });
};

exports['Add Foursquare user'] = function(test) {
    Bozuko.models.User.addOrModify(fs_user, phone1, 'foursquare', function(err, u) {
        test.ok(!err);
        test.equal(u.phones.length, 1);
        test.equal(u.services.length, 2);
        test.done();
    });
};

exports['Change phone type for Foursquare user'] = function(test) {
    Bozuko.models.User.addOrModify(fs_user, phone1_android, 'foursquare', function(err, u) {
        test.ok(err);
        Bozuko.models.User.findOne({'services.name': 'foursquare', 'services.sid': fs_user.id}, function(err, user) {
            test.ok(!err);
            test.ok(user);
            test.equal(user.phones.length, 1);
            test.equal(user.services.length, 2);
            test.deepEqual(user.phones[0].type, phone1.type);
            test.done();
        });
    });
};

exports.cleanup = function(test) {
    Bozuko.models.User.remove({}, function() {
        test.done();
    });
};
