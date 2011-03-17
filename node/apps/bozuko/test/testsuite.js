var express = require('express');
var bozuko = require('../bozuko');
var assert = require('assert');
var async = require('async');
var facebook = require("../app/util/facebook");

assert.headers = {
    'BOZUKO_FB_USER_ID': '100001863668743',
    'BOZUKO_FB_ACCESS_TOKEN' : '166078836756369|81213baf1a427b66698083c8-100001863668743|VGHsgIgaHcr9twaMGSzLhctxZe0'
};

assert.keys = function(object, properties) {
    properties.forEach(function(prop) {
	assert.ok(prop in object);
    });
};

var auth = assert.headers.BOZUKO_FB_ACCESS_TOKEN;

exports.setup = function(fn) {
    bozuko.app = express.createServer();
    bozuko.run('test');
    async.series([del_users, del_pages, add_users, add_pages], function(err, res) {
        fn();
    });
};

exports.teardown = function() {
    setTimeout(function(){bozuko.db.conn().disconnect();}, 1);
};

var del_users = function(callback) {
    bozuko.models.User.remove(function(){callback(null, '');});
};

var del_pages = function(callback) {
    bozuko.models.Page.remove(function(){callback(null, '');});
};

var add_users = function(callback) {
    var u = new bozuko.models.User();
    u.name = "Bobby Bozuko",
    u.first_name = "Bobby",
    u.last_name = "Bozuko",
    u.gender = "male",
    u.email = "bozukob@gmail.com",
    u.service('facebook',
        "100001863668743",
        auth, {
            "id" : "100001863668743",
            "name" : "Bobby Bozuko",
            "first_name" : "Bobby",
            "last_name" : "Bozuko",
            "link" : "http://www.facebook.com/profile.php?id=100001863668743",
            "gender" : "male",
            "email" : "bozukob@gmail.com",
            "timezone" : -5,
            "locale" : "en_US",
            "updated_time" : "2010-11-16T00:21:50+0000"
        });
    u.save(function(){callback(null,'');});
};

var add_pages = function(callback) {
    var data = {
        "id": "196365723046",
        "name": "Hookslide Kelly's",
        "picture": "http://profile.ak.fbcdn.net/hprofile-ak-snc4/187766_196365723046_1719856_s.jpg",
        "link": "http://www.facebook.com/pages/Hookslide-Kellys/196365723046",
        "category": "Bar",
        "website": "www.hookslidekellys.com ",
        "location": {
            "street": "19 Merrimack St.",
            "city": "Lowell",
            "state": "MA",
            "country": "United States",
            "zip": "01854",
            "latitude": 42.645691969652,
            "longitude": -71.307771515274
        },
        "parking": {
            "street": 1
        },
        "public_transit": "Parking garage located at 75 John Street-Steps from Hookslide Kelly's back entrance",
        "hours": {
            "mon_1_open": 432000,
            "mon_1_close": 468000,
            "tue_1_open": 500400,
            "tue_1_close": 554400,
            "wed_1_open": 586800,
            "wed_1_close": 36000,
            "thu_1_open": 68400,
            "thu_1_close": 122400,
            "fri_1_open": 154800,
            "fri_1_close": 208800,
            "sat_1_open": 241200,
            "sat_1_close": 295200,
            "sun_1_open": 327600,
            "sun_1_close": 381600
        },
        "attire": "Casual",
        "payment_options": {
            "visa": 1,
            "amex": 1,
            "mastercard": 1,
            "discover": 1
        },
        "restaurant_services": {
            "walkins": 1,
            "groups": 1,
            "kids": 1,
            "takeout": 1,
            "catering": 1,
            "outdoor": 1
        },
        "restaurant_specialties": {
            "lunch": 1,
            "dinner": 1,
            "drinks": 1
        },
        "phone": "(978) 654-4225 ",
        "checkins": 224,
        "likes": 2555
    };

    var page = new bozuko.models.Page();
    bozuko.models.User.findOne({name: "Bobby Bozuko"}, function(err, user) {
        if (user) {
            assert.uid = ''+user._id;
            page.owner_id = user._id;
            page.name = data.name;
            page.games = [],
            page.is_location = data.location && data.location.latitude ? true : false;
            if(page.is_location){
                page.lat = parseFloat(data.location.latitude);
                page.lng = parseFloat(data.location.longitude);
            }
            page.service('facebook', data.id, auth, data);
            page.save(function(){callback(null,'');});
        } else {
            throw("Error looking up Bobby Bozuko: err = "+err);
        }
    });
};
