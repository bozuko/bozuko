var express = require('express');
var bozuko = require('../bozuko');
var assert = require('assert');
var async = require('async');

assert.headers = {
    'BOZUKO_FB_USER_ID': '100001863668743',
    'BOZUKO_FB_ACCESS_TOKEN' : '166078836756369|81213baf1a427b66698083c8-100001863668743|VGHsgIgaHcr9twaMGSzLhctxZe0'
};

assert.keys = function(object, properties) {
    properties.forEach(function(prop) {
	assert.ok(prop in object);
    });
};

assert.page_id = "181069118581729";

var auth = assert.headers.BOZUKO_FB_ACCESS_TOKEN;

exports.setup = function(fn) {
    bozuko.app = express.createServer();
    bozuko.run('test');
    async.series([
		emptyCollection('User'),
		emptyCollection('Page'),
		emptyCollection('Contest'),
		emptyCollection('Entry'),
		emptyCollection('Checkin'),
		add_users,
		add_pages,
		add_contests
	], function(err, res) {
        fn();
    });
};

exports.teardown = function() {
    setTimeout(function(){Bozuko.db.conn().disconnect();}, 1);
};

var emptyCollection = function(name) {
	return function(callback){
		Bozuko.models[name].remove(function(){callback(null, '');});
	};
};

var add_users = function(callback) {
    var u = new Bozuko.models.User();
    u.name = "Bobby Bozuko",
    u.first_name = "Bobby",
    u.last_name = "Bozuko",
    u.gender = "male",
    u.email = "Bozuko.@gmail.com",
    u.service('facebook',
        "100001863668743",
        auth, {
            "id" : "100001863668743",
            "name" : "Bobby Bozuko",
            "first_name" : "Bobby",
            "last_name" : "Bozuko",
            "link" : "http://www.facebook.com/profile.php?id=100001863668743",
            "gender" : "male",
            "email" : "Bozuko.@gmail.com",
            "timezone" : -5,
            "locale" : "en_US",
            "updated_time" : "2010-11-16T00:21:50+0000"
        });
    u.save(function(){callback(null,'');});
};

var add_pages = function(callback) {
    var data =
        { "services" : [
        {
            "name" : "facebook",
            "sid" 	: "181069118581729",
            "auth" : "166078836756369|242533771ff71c4e019a9350-557924168|KsXKYtlwW3IQuduNQQofNZ-A8Vw",
            "data" : {
                "id" : "181069118581729",
                "name" : "Owl Watch Lowell",
                "picture" : "http://profile.ak.fbcdn.net/hprofile-ak-snc4/174638_181069118581729_1906773_s.jpg",
                "link" : "http://www.facebook.com/pages/Owl-Watch-Lowell/181069118581729",
                "category" : "Local business",
                "website" : "http://www.owlwatch.com",
                "location" : {
                    "street" : "100 Massmills Dr #129",
                    "city" : "Lowell",
                    "state" : "MA",
                    "country" : "United States",
                    "zip" : "01852",
                    "latitude" : 42.646261785714,
                    "longitude" : -71.303897114286
                },
                "parking" : {
                    "street" : 1
                },
                "phone" : "978 452 2224",
                "fan_count" : 1,
                "can_post" : true,
                "checkins" : 1
            }
        }
], "name" : "Owl Watch Lowell", "is_location" : true, "lat" : 42.646261785714, "lng" : -71.303897114286};

    var page = new Bozuko.models.Page();
    Bozuko.models.User.findOne({name: "Bobby Bozuko"}, function(err, user) {
        if (user) {
	    assert.uid = ''+user._id;
            page.owner_id = user._id;
            page.name = data.name;
            page.games = [],
            page.is_location = true;
            page.lat = data.lat;
            page.lng = data.lng;
            page.service('facebook', data.services[0].sid, data.services[0].auth, data.services[0].data);
            page.save(function(){callback(null,'');});
        } else {
            throw("Error looking up Bobby Bozuko: err = "+err);
        }
    });
};


var add_contests = function(callback) {

    var start = new Date();
    var end = new Date();
    end.setTime(start.getTime()+1000*60*60*24*2);

    var data = {
        start                   :start,
		game					:'slots',
		game_config				:{},
		end                     :end,
		total_entries           :6,
		play_cursor             :0,
		token_cursor            :0
    };

    Bozuko.models.Page.findOne({name:/owl/i}, function(error, page){
	if( error || !page ){
	    throw("No page for hookslides");
	}
	data.page_id = ''+page._id;
	var contest = new Bozuko.models.Contest(data);
		contest.entry_config.push({
			type: 'facebook/checkin',
			tokens: 3
		});
		contest.prizes.push({
			name: 'T-Shirt',	
			value: '20',
			description: "Awesome Owl Watch T-Shirt",
			total: 10
		});
		contest.save(function(error){
			Bozuko.models.Contest.findById(contest.id,function(error, contest){
				contest.generateResults( function(error){
					callback(null);
				});
			});
		});
    });
};
