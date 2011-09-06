process.env.NODE_ENV='test';

var express = require('express');
var Bozuko = require('../../../app/bozuko');
var assert = require('assert');
var async = require('async');
var http = require('http');

var users = {
    a: {
        'id': '100001848849081',
        'auth' : '225077010865990|c55eacc9bc1097ba9ffe133d.1-100001848849081|hH18si5YDG-YoIoLAf_2IciZDQs'
    },
    b: {
        'id': '100001863668743',
        'auth' : '225077010865990|379bc114f914fa3983c0129f.1-100001863668743|xh3EcHoiXpVtzyeOavrFJUZlnbE'
    }
};

var user = users.b;

//assert.token = "43a9d844542c6570a1b267e2c88a9f11d00556d51e4768c5b33364d78c4324ac17e5eee3f37a9ccea374fda76dfb44ec714ea533567e12cdadefbc0b44ea1e7e";

assert.page_id = "181069118581729";

assert.phone = {
    type: 'iphone',
    unique_id: '425352525232535'
};


/**
 * Modified version of assert.response from expresso.
 * Note that this counts as three nodeunit assertions for expect() purposes.
 *
 * Assert response from `server` with
 * the given `req` object and `res` assertions object.
 *
 *
 * @param {Server} server
 * @param {Object} req
 * @param {Object|Function} res
 * @param {String} callback
 */

assert.response = function(test, server, req, res, callback){
    var client = http.createClient(Bozuko.config.server.port);

    // Issue request
    var timer,
    method = req.method || 'GET',
    status = res.status || res.statusCode,
    data = req.data || req.body,
    requestTimeout = req.timeout || 10000;

    var request = client.request(method, req.url, req.headers);

    // Timeout
    if (requestTimeout) {
        timer = setTimeout(function(){
            test.fail('Request timed out after ' + requestTimeout + 'ms.');
        }, requestTimeout);
    }

    if (data) request.write(data);
    request.on('response', function(response){
        response.body = '';
        response.setEncoding('utf8');
        response.on('data', function(chunk){ response.body += chunk; });
        response.on('end', function(){
            if (timer) clearTimeout(timer);

            // Assert response body
            if (res.body !== undefined) {
                var eql = res.body instanceof RegExp
                    ? res.body.test(response.body) : res.body === response.body;
                test.ok(eql);
            }

            // Assert response status
            if (typeof status === 'number') {
                test.equal(response.statusCode, status);
            }

            // Assert response headers
            if (res.headers) {
                var keys = Object.keys(res.headers);
                for (var i = 0, len = keys.length; i < len; ++i) {
                    var name = keys[i],
                    actual = response.headers[name.toLowerCase()],
                    expected = res.headers[name],
                    eql = expected instanceof RegExp
                        ? expected.test(actual)
                        : expected == actual;
		    test.ok(eql);
                }
            }

            // Callback
            callback(response);
        });
    });
    request.end();

};

var auth = user.auth;
var profiler;

exports.setup = function(fn) {

    if( !Bozuko.app ){
        Bozuko.getApp().listen(Bozuko.getConfig().server.port);
    }
    profiler = Bozuko.require('util/profiler').create('testsuite');
    async.series([
	emptyCollection('User'),
	emptyCollection('Page'),
	emptyCollection('Contest'),
	emptyCollection('Checkin'),
	emptyCollection('Entry'),
	emptyCollection('Play'),
	emptyCollection('Prize'),
	add_users,
	add_pages,
	add_contests
    ], function(err, res) {
        if (err) console.log("testsuite setup error");
        profiler.mark('setup complete');
        fn();
    });
};

var emptyCollection = function(name) {
    return function(callback){
        Bozuko.models[name].remove(function(){
	    console.log(name+' collection emptied');
	    callback(null, '');
	});
    };
};

var add_users = function(callback) {
    console.log('add users');
    Bozuko.service('facebook').user({user_id:user.id}, function(error, user){
		if( error ){
			console.log(error.stack);
			return callback(error);
		}
		return Bozuko.models.User.createFromServiceObject(user, function(error, user){
			if( error ) return callback( error );
			user.service('facebook').auth = auth;
			user.phones.push(assert.phone);
			assert.challenge = user.challenge;

			user.service('facebook').internal = {likes : ['181069118581729']};

			return user.save( function(error){
                            if( error ) return callback( error );
                            console.log('added users');
                            assert.token = user.token;
			    return callback( null, user);
			});
		});
    });
};

var pages = [
    // hookslides
    '181069118581729', 	// owl watch
    '103621403038522', 	// middlesex
    "111730305528832", 	// dunks
    // boston
    "108123539229568",	// hard rock
    //"75568770316", 		// black rose
    // florida
    "185253393876" 		// owl watch florida
];
var add_pages = function(callback, i) {
    i = i || 0;
    if( i < pages.length ){
        add_page(pages[i], function(error){
            profiler.mark('add page');
            add_pages(callback, i+1);
        });
    }
    else{
        console.log('no pages');
        callback(null,'');
    }
};

function add_page(id, callback){
    Bozuko.service('facebook').place({place_id:id}, function(error, place){
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
	    page.active = true;
	    page.security_img = '/security/image.png';
            page.save(function(){callback(null,'');});
        });
    });
}

var add_contests = function(callback) {
    var start = new Date();
    var end = new Date();
    end.setTime(start.getTime()+1000*60*60*24*2);

    var data = {
		active: true,
        start: start,
        game: 'slots',
		game_config: {
			theme: 'seadog'
		},
		end: end,
		total_entries: 30,
        free_play_pct: 50
    };

    Bozuko.models.Page.find({name:/owl/i}, function(error, pages){
        if( error || !pages ){
            throw("No page for Owl Watch");
        }
		async.forEach(pages,

			function iterator(page,cb){
				data.page_id = ''+page._id;
				var contest = new Bozuko.models.Contest(data);
				contest.win_frequency = 1;
				contest.entry_config.push({
					type: 'facebook/checkin',
					tokens: 3,	
					enable_like: false,
					duration: 1000 * 5
				});
				contest.prizes.push({
					name: 'Wicked cool T-Shirt',
					value: 20,
					description: "Awesome Owl Watch T-Shirt",
					details: "Only available in Large or Extra-large",
					instructions: "Show this screen to an employee",
					duration: 1000*60*60,
					total: 2
				});
				contest.prizes.push({
					name: 'Owl Watch Mug',
					value: 10,
					description: "Sweet travel Mug",
					details: "Not good for drinking out of.",
					instructions: "Show this screen to an employee",
					duration: 1000*60*60,
					total: 10
				});
				contest.prizes.push({
					name: 'A whole lot of nothing',
					value: 0,
					description: "You get nothing at all",
					instructions: "Show this screen to an employee",
					duration: 1000*60*60,
					total: 20
				});
				contest.publish(function(error){
					if( error ) return cb(error);
					return Bozuko.models.Contest.findById(contest.id,function(error, contest){
						if( error ) return cb(error);
						return contest.generateResults( function(error){
							cb(error);
						});
					});
				});
			},

			function finish(err){
				callback(null);
			}
		);

    });
};
