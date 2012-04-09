var testsuite = require('./config/testsuite'),
    request = testsuite.request;

exports.setup = function(test) {
    testsuite.setup(test.done);
};
var name = 'test user1',
    email = 'test1@bozuko.com',
    token = null;

// A local user is identified solely by an email address
exports['Create a new local user'] = function(test) {
    request({method: 'POST', uri: '/client/local', json: {
        name: name,
        email: email 
    }}, function(err, res, body) {
      test.ok(!err);
      test.equal(res.statusCode, 200);
      test.done();
    });
};

exports['The user exists and has a token'] = function(test) {
    Bozuko.models.User.findOne({email: email, local: true}, function(err, user) {
        test.ok(!err);
        test.ok(user);
        test.ok(user.token);
        test.done();
    });
};

exports['Attempting to create a user with the same email address fails'] = function(test) {
    request({method: 'POST', uri: '/client/local', json: {
        name: name,
        email: email
    }}, function(err, res, body) {
        test.ok(!err);
        test.notEqual(res.statusCode, 200);
        test.done();
    });
};

exports['Login'] = function(test) {
    request({method: 'POST', uri: '/client/local/login', json: {
        email: email
    }}, function(err, res, body) {
        test.ok(!err);
        test.equal(res.statusCode, 200);
        token = body.token;
        test.done();
    });
};

