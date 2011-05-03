var async = require('async');
var assert = require('assert');
var mongoose = require('mongoose');

var page_ids = exports.page_ids = [];
    user_ids = exports.user_ids = [];
    contest_ids = exports.contest_ids = [];

var pages = [{
    city: 'MA - Faneuil Hall',
    lat: 42.360133,
    lng: -71.055767,
    ids: [
        '109610592397958',
        '268434134314',
        '105728236128280',
        '109143555771546',
        '108123539229568',
        '116813875003123',
        '152621531418375',
        '149312245095433',
        '146168375414762',
        '140282292684587',
        '102579459803606',
        '120265658025516',
        '145393932150641',
        '121705237878224',
        '136585406382842',
        '133420806706462',
        '115260441868341',
        '145849108780767',
        '116038411757918',
        '111927165505524'
    ]
}, {
    city: 'MA - Back Bay',
    lat: 42.34964,
    lng: -71.082165,
    ids: [
        '124800987569949',
        '121592517855684',
        '148560378498199',
        '140209179378877',
        '125860534128664',
        '116900815000348',
        '152984131383970',
        '168706466483369',
        '149122355114343',
        '151940091484739',
        '116180175069680',
        '202365499775032',
        '117955551564981',
        '119426118108878',
        '121120414604291',
        '100505133342083',
        '141482275890258',
        '116319218391935',
        '113655315323280',
        '141162589252811'
    ]
},
{
    city: 'MA - Davis Square',
    lat: 42.396476,
    lng: -71.122436,
    ids: [
        '115765841786915',
        '164489203587617',
        '200123986670217',
        '145329975502481',
        '100500716676289',
        '143469272359987',
        '113731115327377',
        '197147623640778',
        '81810755661',
        '153278041354747',
        '122075817802697',
        '108139895894503',
        '129148010466588',
        '117743048252820',
        '117689721590676',
        '116704485021010',
        '113257972039903',
        '24537581097',
        '140936455965151',
        '153763751300612'
    ]
},
{
    city: 'MA - Hookslides',
    lat: 42.645494,
    lng: -71.307777,
    ids: [
        '147180168638415',
        '104187332979391',
        '111730305528832',
        '111592575545702',
        '117665838259824',
        '113384912027983',
        '121083381236448',
        '147265788631363',
        '196365723046',
        '117384641613788',
        '107226786000718',
        '148281571887154',
        '175025632512675',
        '145755095446946',
        '147872785275809',
        '476577005513',
        '120434094634461',
        '182044405164979',
        '100866566624858',
        '108933965837953'
    ]
}];

exports.random_city = function() {
    return pages[Math.floor(Math.random()*pages.length)];
};

var user_ct;

var cleanup = exports.cleanup = function(callback) {
    async.series([
	emptyCollection('User'),
	emptyCollection('Page'),
	emptyCollection('Contest'),
	emptyCollection('Checkin'),
	emptyCollection('Play'),
	emptyCollection('Prize')
    ], callback);
};

exports.setup = function(options, callback) {
    user_ct = options.users;
    mongoose.connection.on('open', function() {
        cleanup(function(err) {
            if (err) return callback(err);
            async.forEach([
                {
                    fn: add_users,
                    val: options.users
                },{
                    fn: add_pages,
                    val: pages
                }],
                function(obj, callback) {
                    obj.fn(obj.val, callback);
                },
                function(err) {
                    callback(err);
                }
            );
        });
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

function add_pages(pages, callback) {
    async.forEach(pages,
        function(location, cb) {
            async.forEach(location.ids, function(sid, cb) {
                Bozuko.service('facebook').place({place_id: sid}, function(err, place) {
                    if (err) return cb(err);
                    if (!place) return cb();

                    return Bozuko.models.Page.createFromServiceObject(place, function(err, page) {
                        if (!page) return cb(new Error("page "+sid+" not created"));
                        page.owner_id = user_ids[Math.floor(Math.random()*user_ct)];
                        return page.save(function(err) {
                            if (err) cb(err);
                            page_ids.push(page._id);
                            add_contest(page._id, cb);
                        });
                    });
                });
                },
                function(err) {
                    cb(err);
                }
            );
        },
        function(err) {
            callback(err);
        }
    );
}

function add_contest(page_id, callback) {
    var contest = new Bozuko.models.Contest({
        page_id: page_id,
        game: 'slots',
        game_config: {
            icons: ['seven','bar','bozuko','banana','monkey','cherries']
        },
        entry_config: [{
            type: "facebook/checkin",
            tokens: 3
        }],
        start: new Date(),
        end: new Date(2013, 9, 2),
        total_entries: 1000000,
        total_plays: 3000000,
        play_cursor: -1,
        token_cursor: -1
    });
    contest.prizes.push({
        name: 'Owl Watch Mug',
        value: '10',
        description: "Sweet travel Mug",
        details: "Not good for drinking out of.",
        instructions: "Show this screen to an employee",
        total: 10
    });
    contest.save(function(err) {
        if (err) return callback(err);
        contest_ids.push(contest._id);
        contest.generateResults(function(err) {
            callback(err);
        });
    });
}

function add_users(count, callback) {
    var ct = 0;
    async.until(
        function() { return ct === count - 1; },
        function(cb) {
            var user = new Bozuko.models.User({
                id: ''+ct,
                service: 'facebook',
                name: 'user '+ct,
                first_name: 'user',
                last_name:  ''+ct,
                email: 'user@'+ct+'.com',
                token: ''+ct,
                gender: 'trans'
            });
            phone = {
                type: 'iphone',
                unique_id: ''+ct
            };
            Bozuko.models.User.addOrModify(user, phone, function(err, u) {
                user_ids.push(u._id);
                ct++;
                cb(err);
            });
        },
        function(err) {
            callback(err);
        }
    );
}
