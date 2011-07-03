var async = require('async');
var assert = require('assert');
var mongoose = require('mongoose');
var inspect = require('util').inspect;

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
        '75568770316',
        '152621531418375',
        '149312245095433',
        '117344094964029',
        '140282292684587',
        '102579459803606',
        '120265658025516',
        '145393932150641',
        '121705237878224',
        '136585406382842',
        '110466868990793',
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
        '165152827649',
        '148560378498199',
        '140209179378877',
        '125860534128664',
        '116900815000348',
        '22508827207',
        '168706466483369',
        '149122355114343',
        '110294802394810',
        '116180175069680',
        '202365499775032',
        '117955551564981',
        '119426118108878',
        '121120414604291',
        '100505133342083',
        '141482275890258',
        '116319218391935',
        '113655315323280',
        '110861058926430'
    ]
},
{
    city: 'MA - Davis Square',
    lat: 42.396476,
    lng: -71.122436,
    ids: [
        '115765841786915',
        '164489203587617',
        '49310988779',
        '145329975502481',
        '371449744466',
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
        '110466868990793',
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

exports.setup = function(options, callback) {
    console.log("options = "+inspect(options));
    user_ct = options.users;
    function create() {
        async.forEachSeries([
            {
                fn: add_users,
                val: options.users
            },{
                fn: add_pages,
                val: options.pages || pages
            },
            {
                fn:  add_contests,
                val: options
            }],
            function(obj, callback) {
                obj.fn(obj.val, callback);
            },
            function(err) {
                callback(err);
            }
        );
    }

    mongoose.connection.on('open', function() {
        return create();
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
            return async.forEach(location.ids, function(sid, cb) {
                return Bozuko.service('facebook').place({place_id: sid}, function(err, place) {
                    if (err) return cb(err);
                    if (!place) return cb();

                    return Bozuko.models.Page.createFromServiceObject(place, function(err, page) {
                        if (err) return cb(err);
                        if (!page) return cb(new Error("page "+sid+" not created"));
                        page.owner_id = user_ids[Math.floor(Math.random()*user_ct)];
                        return page.save(function(err) {
                            page_ids.push(page._id);
                            return cb(err);
                        });
                    });
                });
                },
                function(err) {
                    return cb(err);
                }
            );
        },
        function(err) {
            return callback(err);
        }
    );
}

function add_contests(options, callback) {
    var ct = 0;
    var page_ct = 0;
    console.log("options.contests = "+options.contests);
    async.until(
        function() { return ct == options.contests; },
        function(cb) {
            var contest = new Bozuko.models.Contest({
                page_id: page_ids[page_ct],
                game: 'slots',
                game_config: {
                    icons: ['seven','bar','bozuko','banana','monkey','cherries']
                },
                entry_config: [{
                    type: "facebook/checkin",
                    tokens: options.plays_per_entry,
                    // allow unlimited checkins
                    duration: 0
                }],
                start: new Date(),
                end: new Date(2013, 9, 2),
                total_entries: options.entries,
                active: true,
                free_play_pct: options.free_play_pct
            });
            contest.prizes.push({
                name: 'Best Prize Ever',
                value: '10',
                description: "Can\'t tell you what it is",
                details: "You Wish",
                duration: "600000",
                instructions: "Figure it out and use it",
                total: options.prizes
            });
            contest.save(function(err) {
                if (err) {
                    console.log("error!!!!!");
                    return callback(err);
                }
                contest_ids.push(contest._id);
                contest.generateResults(function(err) {
                    ct++;
                    console.log("ct = "+ct);
                    if (page_ct === page_ids.length - 1) {
                        page_ct = 0;
                    } else {
                        page_ct++;
                    }
                    return cb(err);
                });
            });
        },
        function(err) {
            callback(err);
        }
    );
}

function add_users(count, callback) {
    var ct = 0;
    async.until(
        function() { return ct === count; },
        function(cb) {

            var u = new Bozuko.models.User();
            u.name = 'user '+ct;
            u.first_name = 'user';
            u.last_name =  ''+ct;
            u.email = 'user@'+ct+'.com';
            u.token = ''+ct;
            u.challenge = ct;
            u.image = "http://graph.facebook.com/557924168/picture?type=large";
            u.gender = 'trans';
            u.phones = [{
                type: 'iphone',
                unique_id:''+ct
            }];

            u.service('facebook', ''+ct, u.token, "somedata");

            return u.save(function(err) {
                if (err) return cb(err);
                user_ids.push(u._id);
                ct++;
                cb();
            });

        },
        function(err) {
            console.log("err = "+err);
            callback(err);
        }
    );
}
