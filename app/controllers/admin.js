var facebook    = Bozuko.require('util/facebook'),
    Page        = Bozuko.require('util/page'),
    qs          = require('querystring'),
    Dashboard   = require('./base/dashboard'),
    url         = require('url'),
    spawn       = require('child_process').spawn,
    sys         = require('sys'),
    Path        = require('path'),
    s3          = Bozuko.require('util/s3'),
    GD          = require('node-gd'),
    fs          = require('fs'),
    ObjectId    = require('mongoose').Types.ObjectId,
    filter      = Bozuko.require('util/functions').filter,
    merge       = Bozuko.require('util/functions').merge,
    array_map   = Bozuko.require('util/functions').map,
    Report      = Bozuko.require('core/report'),
    DateUtil    = Bozuko.require('util/date'),
    XRegExp     = Bozuko.require('util/xregexp'),
    async       = require('async')
;

exports.access = 'admin';

exports.restrictToUser = false;

exports.routes = {

    '/dev/reset' : {
        get : {
            handler: function(req, res){
                Bozuko.require('dev/setup').init(function(){
                    res.send('reset the development environment');
                });
            }
        }
    },
    
    '/admin/upgrade/from/owners': {
        get : {
            handler : function(req, res){
                
                Bozuko.models.Page.collection.update({
                    owner_id: {$exists:false}
                },{
                    $set: {active: false}
                },{
                    multi: true
                }, function(error, result){
                    console.log(error);
                    console.log(result);
                    res.send('done.');
                });
            }
        }
    },
    
    '/admin/checkandsend/:id' : {
        get : {
            handler : function(req, res) {
                
                var test = true;
                
                Bozuko.models.Contest.findById( req.param('id'), function(error, contest){
                    if( error ) return error.send( res );
                    if( !contest ) return res.send({error:'no contest'});
                    return Bozuko.models.Prize.find({contest_id: contest._id, is_email: false}, function(error, prizes){
                        if( error ) return error.send( res );
                        // go through each prize
                        
                        var results=[];
                        
                        return async.forEachSeries( prizes,
                                           
                            function iterator(prize, cb){
                                
                                var contest_prize = contest.prizes.id( prize.prize_id ),
                                    result = contest.results[prize.play_cursor];
                                    
                                if( !contest_prize.is_email ){
                                    return cb();
                                }
                                
                                return Bozuko.models.User.findById( prize.user_id, function(error, user){
                                    if( error ) return cb(error);
                                    
                                    if( !user ) return cb(new Error('Invalid user ID?'));
                                    
                                    if( test ) {
                                        results.push({play_cursor: prize.play_cursor, result: result, prize:prize.name, email_code: contest_prize.email_codes[result.count], user_name: user.name, already_redeemed: prize.redeemed});
                                        return cb();
                                    }
                                    
                                    prize.is_email = true;
                                    prize.email_format = contest_prize.email_format;
                                    prize.email_body = contest_prize.email_body;
                                    prize.email_subject = contest_prize.email_subject;
                                    prize.email_code = contest_prize.email_codes[result.count];
                                    
                                    return prize.save(function(error){
                                        if( error ) return cb(error);
                                        // we need to get this user too
                                        
                                        if( !prize.redeemed ) return prize.redeem(user, function(error){
                                            if( error ) return cb(error);
                                            results.push({prize:prize.name, email_code: prize.email_code, user_name: user.name, already_redeemed: false});
                                            return cb();
                                        });
                                        
                                        else {
                                            prize.sendEmail( user );
                                            results.push({prize:prize.name, email_code: prize.email_code, user_name: user.name, already_redeemed: true});
                                            return cb();
                                        }
                                        
                                    });
                                });
                            },
                            
                            function complete(error){
                                if( error ) return error.send(res);
                                return res.send('<pre>'+JSON.stringify(results,null,'  ')+'</pre>');
                            }
                            
                        );
                    });
                });
                
            }
        }
    },
    
    '/admin/add/search/params/:type': {
        get : {
            handler : function(req, res){
                var user_map = {}, page_map={}, atEnd = false;
                var do_update = function(model, callback){
                    var collection = model.collection;
                    collection.find({}, function(error, cursor){
                        
                        async.whilst(
                            
                            function(){ return !atEnd; },
                            
                            function(_cb){
                                cursor.nextObject(function( err, obj ){
                                    
                                    if( err ){
                                        return _cb(err);
                                    }
                                    if( !obj ) {
                                        atEnd = true;
                                        return _cb();
                                    }
                                    var user_name,
                                        page_name,
                                        user_id = obj.user_id,
                                        page_id = obj.page_id
                                        ;
                                        
                                    return async.series([
                                        function get_user(cb){
                                            if( user_map[String(user_id)] ){
                                                user_name = user_map[String(user_id)];
                                                return cb(null);
                                            }
                                            return Bozuko.models.User.findOne({_id: user_id}, {name:1}, function(error, user){
                                                if( error ) return cb(error);
                                                if( !user ){
                                                    user_name = '';
                                                }else{
                                                    user_name = user.name;
                                                }
                                                user_map[String(user_id)] = user_name;
                                                return cb(null);
                                            });
                                        },
                                        function get_page(cb){
                                            if( page_map[String(page_id)] ){
                                                page_name = page_map[String(page_id)];
                                                return cb(null);
                                            }
                                            return Bozuko.models.Page.findOne({_id: page_id}, {name:1}, function(error, page){
                                                if( error ) return cb(error);
                                                if( !page ){
                                                    page_name = '';
                                                }
                                                else{
                                                    page_name = page.name;
                                                }
                                                page_map[String(page_id)] = page_name;
                                                return cb(null);
                                            });
                                        }
                                    ], function finish(error){
                                        collection.update({_id: obj._id}, {$set:{page_name: page_name, user_name:user_name}}, function(err, result){
                                            
                                        });
                                        _cb(null);
                                    });
                                    
                                });
                            }, function(error){
                                callback(null);
                            }
                        );
                    });
                };
                async.series([
                    
                    function(cback){
                        var model = req.param('type')=='prize' ? Bozuko.models.Prize : Bozuko.models.Entry;
                        do_update(model, cback);
                    }
                    
                ], function(error){
                    console.log(error);
                    res.send('done.');
                })
            }
        }
    },
    
    '/admin' : {

        get : {

            title: 'Bozuko Administration',
            locals:{
                layout: false
            },

            handler: function(req,res){
                if( req.device == 'touch' ) res.locals.layout = false;
                res.render('admin/index');
            }
        }
    },
    
    '/admin/fix/like/shares' : {
        get: {
            handler : function( req, res ){
                console.log('/admin/fix/like/shares enter');
                // go through each contest...
                var shares = [];
                Bozuko.models.Page.find({}, {_id:1,active:1,name:1}, function(error, pages){
                    console.log('/admin/fix/like/shares after Page.find');
                    if( error ) res.send(error);
                    async.forEach( pages, function iterate(page, callback){
                        console.log('iterating over page '+page._id);
                        
                        // get distinct users
                        return Bozuko.models.Entry.collection.distinct(
                            
                            'user_id',
                            {type:'facebook/like', page_id:page._id},
                            
                            function(error, user_ids){
                                if( error ) return callback(error);
                                
                                // for each user
                                return async.forEach( user_ids, function iterate(user_id, cb){
                                    
                                    
                                    console.log('iterating over user_id '+user_id);
                                    // see if this guy has a share entry
                                    Bozuko.models.Share.count({user_id: user_id, page_id: page._id}, function(error, count){
                                        if( error ) return cb(error);
                                        if( count ) return cb(null);
                                        // we need to add this share...
                                        // lets get the first like entry
                                        return Bozuko.models.Entry.find({
                                            user_id: user_id,
                                            page_id:page._id,
                                            type:'facebook/like'
                                        },{},{sort:{timestamp: 1}},function(error, entries){
                                            if( error ) return cb(error);
                                            
                                            if( !entries ) return cb();
                                            
                                            var entry = entries[0];
                                            
                                            // lets get this user too.
                                            return Bozuko.models.User.findOne({_id: user_id}, {'services.internal.friend_count':1},function(error, user){
                                                if( error ) return cb(error);
                                                
                                                var share = new Bozuko.models.Share({
                                                    user_id: user_id,
                                                    page_id: page._id,
                                                    service: 'facebook',
                                                    type: 'like',
                                                    contest_id: entry.contest_id,
                                                    timestamp: entry.timestamp,
                                                    visibility: user.services[0].internal.friend_count
                                                });
                                                return share.save(function(error){
                                                    if( !error ) shares.push(share);
                                                    return cb(error);
                                                });
                                            });
                                        });
                                    });
                                }, function done_with_users(error){
                                    return callback(error);
                                });
                            });
                        }, function finish(error){
                            if( error ) return res.send(error);
                            return res.send( {count: shares.length, shares:shares} );
                        });
                });
            }
        }
    },

    '/admin/users' : {

        get : {
            handler : function(req, res){
                 // need to get all pages
                var id = req.param('id'),
                    selector = {},
                    user_filter = req.param('user_filter'),
                    search = req.param('search') || req.param('query'),
                    start = req.param('start') || 0,
                    limit = req.param('limit') || 25
                    ;
                
                if( search ){
                    selector.name = new RegExp('(^|\\s)'+XRegExp.escape(search), "i");
                }
                switch( user_filter ){
                    case 'blocked':
                        selector.$or = [
                            {allowed: false},
                            {allowed: {$exists: false}}
                        ];
                        selector.blocked = true;
                        break;
                    case 'allowed':
                        selector.allowed = true;
                        break;
                    case 'losers':
                        selector['services.name'] = 'facebook';
                        selector['services.internal.friend_count'] = {$lt: 10};
                        break;
                }
                
                Bozuko.models.User.find(selector,{
                    'services.internal.likes': 0,
                    'services.internal.friends': 0
                },{
                    sort:{name:1},
                    limit: limit,
                    skip: start
                }, function(error, users){
                    if( error ) return error.send( res );
                    // get the total
                    return Bozuko.models.User.count(selector, function(error, total){
                        if( error ) return error.send( res );
                        return res.send( {items: users, total: total} );
                    });
                });
            }
        }
    },
    
    '/admin/users/:id/block' : {
        post : {
            handler : function(req, res){
                var id = req.param('id');
                Bozuko.models.User.findOne({_id:id}, function(error, user){
                    if( error ) return error.send( res );
                    user.allowed = false;
                    user.blocked = true;
                    return user.save(function(error){
                        if( error ) return error.send(res);
                        return res.send({success:true});
                    });
                });
            }
        },
        del : {
            handler : function(req, res){
                var id = req.param('id');
                Bozuko.models.User.findOne({_id:id}, function(error, user){
                    if( error ) return error.send( res );
                    user.blocked = false;
                    user.allowed = true;
                    return user.save(function(error){
                        if( error ) return error.send(res);
                        return res.send({success:true});
                    });
                });
            }
        }
    },
    
    '/admin/places' : {

        get : {
            handler : function(req, res){
                var options = {};
                if( req.param('ll') ){
                    var ll = (req.param('ll') || '').split(',');
                    if( ll.length !== 2 ){
                        new Error('Invalid ll').send(res);
                    }
                    ll.reverse();
                    options.center = ll;
                }
                if( req.param('filter') ){
                    var filter = JSON.parse( req.param('filter') );
                    if( Array.isArray(filter) ) filter.forEach( function(f){
                        options[f.property] = f.value;
                    });
                }
                if( Object.keys( options ).length === 0 ){
                    return res.send( {items:[]} );
                }
                return Bozuko.service('facebook').search(options, function(error, places){
                    if( error ) return error.send( res );
                    // get rid of the ones we already have...
                    var ids = [];
                    var map = {};
                    places.forEach( function(place, index){
                        ids.push(place.id);
                        map[place.id] = index;
                    });
                    return Bozuko.models.Page.findByService('facebook', ids, function(error, pages){
                        if( error ) return error.send( res );
                        pages.forEach( function(page){
                            var id = page.service('facebook').sid;
                            delete map[id];
                        });
                        var ret = [];
                        for(var id in map){
                            ret.push(places[map[id]]);
                        }
                        return res.send( {items:ret} );
                    });
                });
            }
        }
    },

    '/admin/addpage':{

        post : {
            handler : function(req, res){
                // need a facebook id and a user_id
                var place_id = req.param('place_id');

                if( !place_id ){
                    return new Error('No user or no place').send( res );
                }

                return Bozuko.service('facebook').place({place_id: place_id}, function(error, place){
                    if( error ) return error.send(res);
                    // now we want to create a new place...
                    return Bozuko.models.Page.createFromServiceObject( place, function(error, page){
                        if( error ) return error.send(res);
                        if( !page ) return new Error('weird problem creating place');
                        page.active = false;
                        return page.save(function(error){
                            if( error ) return error.send( res );
                            return res.send(page);
                        });
                    });
                });
            }
        }

    }
};

Dashboard.addRoutes( exports, '/admin' );