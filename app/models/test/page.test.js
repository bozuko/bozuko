var testsuite = require('./config/testsuite');
var async = require('async');

var page = new Bozuko.models.Page();

exports['cleanup'] = function(test) {
   return async.forEach(['CodePrefix', 'Page', 'Contest'],
        function(model, callback) {
            Bozuko.models[model].remove(callback);
        },
        function(err) {
            test.ok(!err);
            test.done();
        }
    );
};

exports['save page'] = function(test) {
    page.save(function(err) {
       test.ok(!err);
       test.done();
    });
};

exports['setCodeInfo 0'] = function(test) {
    return Bozuko.models.Page.setCodeInfo(page._id, function(err) {
        test.ok(!err);
        return Bozuko.models.Page.findById(page._id, function(err, _page) {
            test.ok(!err);
            test.equal(_page.code_prefix, '001');
            test.equal(_page.code_block, 0);
            page = _page;
            test.done();
        });
    });
};

exports['setCodeInfo 1'] = function(test) {
    return Bozuko.models.Page.setCodeInfo(page._id, function(err) {
        test.ok(!err);
        return Bozuko.models.Page.findById(page._id, function(err, _page) {
            test.ok(!err);
            test.equal(_page.code_prefix, '001');
            test.equal(_page.code_block, 1);
            page = _page;
            test.done();
        });
    });
};

exports['add a contest then setCodeInfo'] = function(test) {
    var contest = new Bozuko.models.Contest({page_id: page._id});
    return contest.save(function(err) {
        test.ok(!err);
        return Bozuko.models.Page.setCodeInfo(page._id, function(err) {
            test.ok(!err);
            return Bozuko.models.Page.findById(page._id, function(err, _page) {
                test.ok(!err);
                test.equal(_page.code_prefix, '001');
                test.equal(_page.code_block, 2);
                page = _page;
                test.done();
            });
        });
    });
};