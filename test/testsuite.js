var express = require('express');
var bozuko = require('../bozuko');
var assert = require('assert');
var async = require('async');

var users = {
    a: {
		'id': '100001848849081',
		'auth' : '166078836756369|276ce4323ea377ed62e7b4f6-100001848849081|J6QeM27-_fZKB45vk9t4qRL-b3w'
    },
    b: {
		'id': '100001863668743',
		'auth' : '166078836756369|81213baf1a427b66698083c8-100001863668743|VGHsgIgaHcr9twaMGSzLhctxZe0'
    }
};

var user = users.b;

assert.token = "43a9d844542c6570a1b267e2c88a9f11d00556d51e4768c5b33364d78c4324ac17e5eee3f37a9ccea374fda76dfb44ec714ea533567e12cdadefbc0b44ea1e7e";

assert.keys = function(object, properties) {
    properties.forEach(function(prop) {
	assert.ok(prop in object);
    });
};

assert.page_id = "181069118581729";

var auth = user.auth;

exports.setup = function(fn) {
    process.env.NODE_ENV='test';
	
    bozuko.app = express.createServer();
    bozuko.run();
	var profiler = Bozuko.require('util/profiler').create('setup');
	console.log(Bozuko.config.server.port);
    async.series([
	emptyCollection('User'),
	emptyCollection('Page'),
	emptyCollection('Contest'),
	emptyCollection('Entry'),
	emptyCollection('Checkin'),
	emptyCollection('Play'),
	emptyCollection('Prize'),
	add_users,
	add_pages,
	add_contests
        ], function(err, res) {
		profiler.mark('setup complete')
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

	Bozuko.service('facebook').user({user_id:user.id}, function(error, user){
		if( error ){
			console.log(error);
			return callback(error);
		}
		return Bozuko.models.User.createFromServiceObject(user, function(error, user){
			if( error ) return callback( error );
			user.service('facebook').auth = auth;
			return user.save( function(error){
				if( error ) return callback( error );
				return callback( null, user);
			});
		});
	});
};

var add_pages = function(callback) {
    var auth = "166078836756369|242533771ff71c4e019a9350-557924168|KsXKYtlwW3IQuduNQQofNZ-A8Vw";
    Bozuko.service('facebook').place({place_id:'181069118581729'}, function(error, place){
	if( error ){
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
	    return Bozuko.models.User.findOne({name: /bozuko/i}, function(err, user) {
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
		total_entries           :30
    };

    Bozuko.models.Page.findOne({name:/owl/i}, function(error, page){
        if( error || !page ){
            throw("No page for Owl Watch");
        }
        data.page_id = ''+page._id;
        var contest = new Bozuko.models.Contest(data);
        contest.entry_config.push({
            type: 'facebook/checkin',
            tokens: 3
        });
        contest.prizes.push({
            name: 'Wicked cool T-Shirt',
            value: '20',
            description: "Awesome Owl Watch T-Shirt",
            details: "Only available in Large or Extra-large",
            instructions: "Show this screen to an employee",
            total: 2
        });
        contest.prizes.push({
            name: 'Owl Watch Mug',
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
