var testsuite = require('./config/testsuite');

var user = new Bozuko.models.User({
    name: 'Charlie Sheen',
    first_name: 'Charlie',
    last_name: 'Sheen',
    email: 'bozukob@gmail.com',
    token: 'dfasaa33345353453543',
    gender: 'male',
    bucks: 120
});

var reward1 = new Bozuko.models.Reward({
    name: 'reward1',
    total: 3,
    bucks: 50
});

var reward2 = new Bozuko.models.Reward({
    name: 'reward2',
    total: 1,
    bucks: 1000
});

exports['cleanup'] = function(test) {
    Bozuko.models.User.remove({}, function() {
        Bozuko.models.Reward.remove({}, test.done());
    });
};

exports['save user'] = function(test) {
    user.save(function(err) {
        test.ok(!err);
        test.done();
    });
};

exports['save rewards'] = function(test) {
    reward1.save(function(err) {
        test.ok(!err);
        reward2.save(function(err) {
            test.ok(!err);
            test.done();
        });
    });
};

exports['claim reward1 2 times successfully'] = function(test) {
    user.claimReward(reward1, function(err, newUser) {
        test.ok(!err);
        test.equal(newUser.bucks, 70);
        test.equal(newUser.rewards.length, 1);
        user.claimReward(reward1, function(err, newUser) {
            test.ok(!err);
            test.equal(newUser.bucks, 20);
            test.equal(newUser.rewards.length, 2);
            user = newUser;
            test.done();
        });
    });
};

exports['claim reward1 - fail - not_enough_bucks'] = function(test) {
    user.claimReward(reward1, function(err) {
        test.ok(err);
        test.deepEqual(err.name, 'reward/not_enough_bucks');
        test.done();
    });
};

exports['give the user another 1030 bucks'] = function(test) {
    user.bucks = 1050;
    user.save(function(err) {
        test.ok(!err);
        test.done();
    });
};

exports['redeem the last reward1 - success'] = function(test) {
    user.claimReward(reward1, function(err, newUser) {
        test.ok(!err);
        test.equal(newUser.bucks, 1000);
        test.equal(newUser.rewards.length, 3);
        user = newUser;
        test.done();
    });
};

exports['redeem reward1 - fail - no_more'] = function(test) {
    user.claimReward(reward1, function(err) {
        test.ok(err);
        test.deepEqual(err.name, 'reward/no_more');
        test.done();
    });
};

exports['redeem reward2 - success'] = function(test) {
    user.claimReward(reward2, function(err, newUser) {
        test.ok(!err);
        test.equal(newUser.bucks, 0);
        test.equal(newUser.rewards.length, 4);
        user = newUser;
        test.done();
    });
};

exports['redeem reward2 - fail - not_enough_bucks'] = function(test) {
    user.claimReward(reward2, function(err) {
        test.ok(err);
        test.deepEqual(err.name, 'reward/not_enough_bucks');
        test.done();
    });
};

exports['give user 1000 bucks and redeem reward2 - fail - no_more'] = function(test) {
    user.bucks = 1000;
    user.save(function(err) {
        test.ok(!err);
        user.claimReward(reward2, function(err) {
            test.ok(err);
            test.deepEqual(err.name, 'reward/no_more');
            test.done();
        });
    });
};