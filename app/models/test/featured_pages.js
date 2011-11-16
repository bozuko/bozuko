var testsuite = require('./config/testsuite');
var async = require('async');
var inspect = require('util').inspect;

var user_loc = [-71.1061111, 42.375];

exports['cleanup old pages'] = function(test) {
    Bozuko.models.Page.remove(function(err) {
        test.ok(!err);
        test.done();
    });
};

/*
 * page_details elements are of the format [in_range, max_distance, [lng,lat]]
 */
exports['add pages'] = function(test) {
    var page_details = [
        false,
        ['out_of_range', 25, [-72.3, 42.375]],
        ['in_range', -1, [-74, 50]],
        false,
        ['in_range', 50, [ -71.7, 42 ]],
        true
    ];
    var pages = [];
    var nf_count = 0;
    async.forEach(page_details, function(details, cb) {
        var page = new Bozuko.models.Page({active: true, is_location: true});
        if (details === false) {
            page.name = 'not featured '+nf_count;
            nf_count++;
        } else if (details === true) {
            page.name = 'featured in_range - true';
            page.featured = true;
        } else {
            page.name = 'featured '+details[0]+" "+details[1];
            page.featured = {
                is_featured: true,
                max_distance: details[1]
            };
            page.coords = details[2];
        }
        page.save(cb);
    }, function(err) {
        test.ok(!err);
        test.done();
    });
};

exports['getAllFeaturedPages'] = function(test) {
    Bozuko.models.Page.getFeaturedPages(3, user_loc, function(err, pages) {
        test.ok(!err);
        test.equal(pages.length, 3);
        test.notEqual(pages[0].name.indexOf("featured in_range"), -1);
        test.notEqual(pages[1].name.indexOf("featured in_range"), -1);
        test.notEqual(pages[2].name.indexOf("featured in_range"), -1);
        test.done();
    });
};

exports['get one featured page'] = function(test) {
    Bozuko.models.Page.getFeaturedPages(1, user_loc, function(err, pages) {
        test.ok(!err);
        test.equal(pages.length, 1);
        test.notEqual(pages[0].name.indexOf("featured in_range"), -1);
        test.done();
    });
};
