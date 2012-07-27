var testsuite = require('./config/testsuite');
var async = require('async');

var user = new Bozuko.models.User({
    name: 'Charlie Sheen',
    first_name: 'Charlie',
    last_name: 'Sheen',
    email: 'bozukob@gmail.com',
    token: 'dfasaa33345353453543',
    gender: 'male',
    bucks: 1200000
});

var reward2 = new Bozuko.models.Reward({
    name: 'reward2',
    code: 'doodie2',
    value: 1000,
    bucks: 10000000
});

exports['cleanup'] = function(test) {
    Bozuko.models.User.remove({}, function() {
        Bozuko.models.Reward.remove({}, function(err) {
            test.ok(!err);
            test.done();
        });
    });
};

exports['save user'] = function(test) {
    user.save(function(err) {
        test.ok(!err);
        test.done();
    });
};

exports['save rewards'] = function(test) {
    async.forEachSeries([1,2,3], function(val, cb) {
        var reward = new Bozuko.models.Reward({
            name: 'reward1',
            value: 50,
            code: 'doodie1',
            bucks: 500000
        });
        reward.save(cb);
    }, function(err) {
        test.ok(!err);
        reward2.save(function(err) {
            test.ok(!err);
            test.done();
        });
    });
};

exports['claim reward1 2 times successfully'] = function(test) {
    user.claimReward(50, function(err, newUser, reward) {
        test.ok(!err);
        test.equal(reward.code, 'doodie1');
        test.equal(newUser.bucks, 700000);
        user.claimReward(50, function(err, newUser, reward) {
            test.ok(!err);
            test.equal(reward.code, 'doodie1');
            test.equal(newUser.bucks, 200000);
            user = newUser;
            test.done();
        });
    });
};

exports['claim reward1 - fail - not_enough_bucks'] = function(test) {
    user.claimReward(50, function(err) {
        test.ok(err);
        test.deepEqual(err.name, 'reward/not_enough_bucks');
        test.done();
    });
};

exports['give the user another 10300000 bucks'] = function(test) {
    user.bucks = 10500000;
    user.save(function(err) {
        test.ok(!err);
        test.done();
    });
};

exports['redeem the last reward1 - success'] = function(test) {
    user.claimReward(50, function(err, newUser, reward) {
        test.ok(!err);
        test.equal(newUser.bucks, 10000000);
        test.equal(reward.code, 'doodie1');
        user = newUser;
        test.done();
    });
};

exports['redeem reward1 - fail - no_more'] = function(test) {
    user.claimReward(50, function(err) {
        test.ok(err);
        test.deepEqual(err.name, 'reward/no_more');
        test.done();
    });
};

exports['redeem reward2 - success'] = function(test) {
    user.claimReward(1000, function(err, newUser, reward) {
        test.ok(!err);
        test.equal(newUser.bucks, 0);
        test.equal(reward.code, 'doodie2');
        user = newUser;
        test.done();
    });
};

exports['redeem reward2 - fail - not_enough_bucks'] = function(test) {
    user.claimReward(1000, function(err) {
        test.ok(err);
        test.deepEqual(err.name, 'reward/not_enough_bucks');
        test.done();
    });
};

exports['give user 1000 bucks and redeem reward2 - fail - no_more'] = function(test) {
    user.bucks = 10000000;
    user.save(function(err) {
        test.ok(!err);
        user.claimReward(1000, function(err) {
            test.ok(err);
            test.deepEqual(err.name, 'reward/no_more');
            test.done();
        });
    });
};

exports['ensure that there are 4 rewards that are claimed'] = function(test) {
    Bozuko.models.Reward.find({}, function(err, rewards) {
        test.ok(!err);
        test.equal(rewards.length, 4);
        rewards.forEach(function(r) {
            test.equal(r.claimed, true);
        });
        test.done();
    });
};
