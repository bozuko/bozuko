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

var phone = {
    type: 'iphone',
    unique_id: '11111111'
};

exports['Add Facebook user'] = function(test) {
    Bozuko.models.User.addOrModify(fb_user, phone, function(err, u) {
        test.ok(!err);
        test.equal(u.services.length, 1);
        test.done();
    });
};

exports.cleanup = function(test) {
    Bozuko.models.User.remove({}, function() {
        test.done();
    });
};
