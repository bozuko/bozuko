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
	console.log(Bozuko.config.server.port);
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
	var auth = "166078836756369|242533771ff71c4e019a9350-557924168|KsXKYtlwW3IQuduNQQofNZ-A8Vw";
	Bozuko.service('facebook').place({place_id:'181069118581729'}, function(error, place){
		if( error ){
			console.log('error', error.message);
			return callback(error);
		}
		return Bozuko.models.Page.createFromServiceObject(place, function(error, page){
			if( error ){
				return callback(error);
			}
			
			if( !page ){
				return callback(new Error("WTF!!!"));
			}
			page.service('facebook').auth = auth;
			return Bozuko.models.User.findOne({name: "Bobby Bozuko"}, function(err, user) {
				if (user) {
					assert.uid = ''+user._id;
					page.owner_id = user._id;
					page.save(function(){callback(null,'');});
				} else {
					throw("Error looking up Bobby Bozuko: err = "+err);
				}
			});
		});
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
		total_entries           :12,
		play_cursor             :-1,
		token_cursor            :-1
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
			details: "Only available in Large or Extra-large",
			instructions: "Show this screen to an employee",
			total: 2
		});
		contest.prizes.push({
			name: 'Mug',	
			value: '10',
			description: "Sweet travel Mug",
			details: "Not good for drinking out of.",
			instructions: "Show this screen to an employee",
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
