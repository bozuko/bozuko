var testsuite = require('./config/testsuite');

exports['cleanup'] = function(test) {
    return Bozuko.models.CodePrefix.remove(function(err) {
        test.ok(!err);
        test.done();
    });
};

exports['create CodePrefix on first increment()'] = function(test) {
    return Bozuko.models.CodePrefix.findOne({}, function(err, code_prefix) {
        test.ok(!err);
        test.ok(!code_prefix);
        return Bozuko.models.CodePrefix.increment(function(err, prefix) {
            test.ok(!err);
            test.equal(prefix, '001');
            return Bozuko.models.CodePrefix.count(function(err, count) {
                test.ok(!err);
                test.equal(count, 1);
                test.done();
            });
        });
    });
};

exports['increment'] = function(test) {
    return Bozuko.models.CodePrefix.increment(function(err, prefix) {
        test.ok(!err);
        test.equal(prefix, '002');
        return Bozuko.models.CodePrefix.count(function(err, count) {
            test.ok(!err);
            test.equal(count, 1);
            test.done();
        });
    });
};