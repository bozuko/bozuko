var facebook    = Bozuko.require('util/facebook'),
    Page        = Bozuko.require('util/page'),
    qs          = require('querystring'),
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
    
    '/admin/themes/:game' : {
        get : {
            handler : function( req, res ){
                try{
                    return res.send( {items: Bozuko.games[req.get('game')].themes} );
                }catch(e){
                    return res.send({items:[]});
                }
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

    '/admin/users' : {

        get : {
            handler : function(req, res){
                 // need to get all pages
                var id = req.param('id'),
                    selector = {},
                    user_filter = req.param('user_filter'),
                    search = req.param('search'),
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

    },
    
    '/admin/stats/misc' : {
        // lets get a bunch of miscellaneous stats
        get : {
            handler : function(req, res){
                
                var selector = {},
                    contest_id = req.param('contest_id'),
                    page_id = req.param('page_id')
                    ;
                    
                if( contest_id ) selector.contest_id = new ObjectId(contest_id);
                if( page_id ) selector.page_id = new ObjectId(page_id);
                
                // very simple distinct / count function...
                Bozuko.models.Entry.collection.distinct('user_id', selector, function(error, user_ids){
                    if( error ) return res.send ( error );
                    return res.send({
                        users: user_ids.length
                    });
                });
            }
        }
    },
    
    '/admin/prizes/expired' : {
        get : {
            handler : function(req, res){
                var contest_id = req.param('contest_id');
                if( !contest_id ) res.send({});
                
                var now = new Date(),
                    expired = {};
                
                // first things first, lets get the contest
                Bozuko.models.Contest.findById(contest_id, function(error, contest){
                    if( error ) return res.send( error );
                    if( !contest ) return res.send({});
                    
                    // now lets go through each prize and get expired counts
                    return async.forEachSeries( contest.prizes, function(prize, callback){
                        
                        Bozuko.models.Prize.count({
                            redeemed: false,
                            expires:{$lt: now},
                            prize_id: prize._id,
                            contest_id: contest._id
                        }, function(error, count){
                            expired[String(prize._id)] = count;
                            callback();
                        });
                        
                    }, function finish(){
                        res.send(expired);
                    });
                });
            }
        }
    },

    '/admin/pages' : {
        
        alias : '/admin/pages/:id',

        get : {
            handler : function(req, res){
                // need to get all pages
                var id = req.param('id'),
                    selector = {},
                    search = req.param('search'),
                    showInactive = req.param('showInactive'),
                    start = req.param('start') || 0,
                    limit = req.param('limit') || 25
                    ;
                
                if( !showInactive ){
                    selector.active = true;
                }
                if( search ){
                    selector.name = new RegExp('(^|\\s)'+XRegExp.escape(search), "i");
                }
                
                console.error(require('util').inspect(selector));
                
                if(id) selector._id = new ObjectId(id);
                return Bozuko.models.Page.find(selector,{},{sort:{name:1}, limit: limit, skip: start}, function(error, pages){
                    if( error ) return error.send(res);
                    return Bozuko.models.Page.count(selector, function(error, count){
                        if( error ) return error.send(res);
                        return res.send({items:pages, total: count});
                    });
                });
            }
        },
        
        /* update */
        put : {
            handler : function(req,res){
                console.error( req.param('id'));
                return Bozuko.models.Page.findById( req.param('id'), function(error, page){
                    if( error ) return error.send( res );
                    // else, lets bind the reqest to the page
                    var data = req.body;

                    delete data._id;
                    delete data.owner_id;
                    console.log(data);
                    page.set( data );
                    return page.save( function(error){
                        if( error ) return error.send(res);
                        return res.send( {items: [page]} );
                    });
                })
            }
        }
    },
    
    '/admin/page/image' : {
        post : {
            handler : function(req, res){
                
                if( !req.form ){
                    return res.sendEncoded({success:false, err:'no form'});
                }
                
                return req.form.processed( function(err, fields, files){
                    
                    if( err ){
                        return res.sendEncoded({success:false,err:err});
                    }
                    
                    var id = fields['page_id'];
                    if( !id ){
                        return res.sendEncoded({success: false,err:'no page_id'});
                    }
                    if( !files['image'] ){
                        return res.send({success: false,err:'no image uploaded'});
                    }
                    // lets just save this for now...
                    var file = files['image'];
                        
                    // we need to do a couple things here...
                    
                    if( !~['.png','.jpg','.jpeg','.gif'].indexOf(Path.extname( file.filename ).toLowerCase()) ){
                        return res.sendEncoded({success: false, err:'invalid image type'});
                    }
                    
                    var ext = Path.extname( file.filename );
                    if( ext == '.jpg') ext = '.jpeg';
                    var Ext = ext.replace(/\./,'').replace(/^[a-z]/, function(m0){ return m0.toUpperCase();} );
                    
                    // resize as necessary and crop off any extra
                    return GD['open'+Ext]( file.path, function(err, image, path){
                        if( err ){
                            return res.sendEncoded({success: false, err:'Error openning image'});
                        }
                        // lets get the size of this bad boy.
                        var w = image.width,
                            h = image.height;
                            
                        if( w < 50 || h < 50 ){
                            return res.sendEncoded({success: false, err: 'Image is too small'});
                        }
                        // guess it can't really too big, for now...
                        if( w > 1400 || h > 1400 ){
                            return res.sendEncoded({success: false, err: 'Image is too big.'});
                        }
                        
                        var s = Math.min( w, h, 100 ),
                            sw = w > h ? h : w,
                            sh = h > w ? w : h,
                            sx = w > h ? parseInt((w-h)/2,10) : 0,
                            sy = h > w ? parseInt((h-w)/2,10) : 0,
                            img = GD.createTrueColor(s,s);
                        
                        var color = img.colorAllocate(245,245,245);
                        img.filledRectangle(0,0,s,s,color);
                        image.copyResampled(img, 0, 0, sx, sy, s, s, sw, sh);
                        img.saveAlpha(1);
                        var savedPath = file.path.replace(/\..*$/, '-processed.png');
                        return img.saveJpeg(savedPath, 100, function(error){
                            if( error ){
                                return res.sendEncoded( {success: false, err: "error saving the image"} );
                            }
                            
                            var path = '/pages/'+id+'/image/'+Path.basename(savedPath);
                            return s3.put(savedPath, path, {
                                'x-amz-acl':'public-read',
                                'Content-Type':'image/png'
                            }, function(error, url){
                                
                                fs.unlinkSync(file.path);
                                fs.unlinkSync(savedPath);
                                
                                return res.sendEncoded( {success: true, url: url} );
                            });
                        });
                    });
                    
                    
                });
            }
        }
    },

    '/admin/contests' : {
        
        alias :'/admin/contests/:id',

        get : {
            handler : function(req, res){
                // need to get all pages
                var page_id = req.param('page_id'),
                    selector = {};

                if( page_id ) selector['page_id'] = page_id;
                if( req.param('id') ) selector['_id'] = new ObjectId(req.param('id'));
                return Bozuko.models.Contest.find(selector,{results:0, plays:0},{sort:{active: -1, start:-1}}, function(error, contests){
                    
                    if( error ) return error.send(res);
                    
                    contests.sort(function(a,b){
                        if( a.state=='active' && b.state != 'active' ) return -1;
                        if( b.state=='active' && a.state != 'active' ) return 1;
                        return +b.start-a.start;
                    });
                    return res.send({items:contests});
                });
            }
        },

        post : {
            handler : function(req, res){
                
                var data = filter(req.body),
                    prizes = data.prizes,
                    consolation_prizes = data.consolation_prizes;
                    
                delete data._id;

                delete data.play_cursor;
                delete data.state;
                delete data.total_plays;
                delete data.results;
                delete data.plays;
                
                
                Object.keys(data).forEach(function(key){
                    if( data[key] === null ) delete data[key];
                });

                prizes.forEach(function(prize){
                    delete prize._id;
                });
                
                
                // any other _id things?
                consolation_prizes.forEach(function(prize){
                    delete prize._id;
                });
                
                
                var contest = new Bozuko.models.Contest(data);
                return contest.save( function(error){
                    if( error ) return error.send( res );
                    return res.send({items:[contest]});
                });
            }
        },

        put : {
            handler : function(req, res){

                return Bozuko.models.Contest.findById(req.param('id'), function(error, contest){
                    if( error ) return error.send(res);

                    var data = filter(req.body);

                    var prizes = data.prizes,
                        entry_config = data.entry_config,
                        consolation_prizes = data.consolation_prizes;

                    delete data.prizes;
                    delete data.consolation_prizes;
                    delete data.state;
                    delete data.entry_config;

                    // most definitely do not want to touch this
                    delete data.play_cursor;
                    delete data.token_cursor;

                    // don't want to update this, will throw an error
                    delete data._id;

                    for( var p in data ){
                        if( data.hasOwnProperty(p) ){
                            contest.set(p, data[p] );
                        }
                    }

                    prizes.forEach(function(prize, i){
                        var old, doc;
                        if( prize._id && (old = contest.prizes.id(prize._id)) ){
                            doc = old._doc;
                            for( var p in prize ){
                                if( prize.hasOwnProperty(p) ){
                                    doc[p] = prize[p];
                                }
                            }
                            prizes[i] = doc;
                        }
                    });

                    consolation_prizes.forEach(function(consolation_prize, i){
                        var old, doc;
                        if( consolation_prize._id && (old = contest.consolation_prizes.id(consolation_prize._id)) ){
                            doc = old._doc;
                            for( var p in consolation_prize ){
                                if( consolation_prize.hasOwnProperty(p) ){
                                    doc[p] = consolation_prize[p];
                                }
                            }
                            consolation_prizes[i] = doc;
                        }
                    });

                    // no clue why i have to do this right now...
                    contest.prizes = [];
                    contest.consolation_prizes = [];
                    contest.entry_config = [];

                    // save existing prizes before adding and removing others
                    return contest.save(function(error){

                        if( error ) return error.send( res );
                        prizes.forEach( function(prize){
                            if( !prize._id ) delete prize._id;
                            contest.prizes.push(prize);
                        });
                        consolation_prizes.forEach( function(prize){
                            if( !prize._id ) delete prize._id;
                            contest.consolation_prizes.push(prize);
                        });

                        entry_config.forEach( function(config){
                            contest.entry_config.push( config );
                        });

                        return contest.save( function(error){
                            if( error ){
                                console.log(error);
                                return error.send( res );
                            }
                            return Bozuko.models.Contest.findById( contest.id, function(error, contest){
                                if( error ) return error.send( res );
                                return res.send( {items: [contest]} );
                            });
                        });
                    });
                });
            }
        },

        del : {
            // delete the record
            handler : function(req,res){
                return Bozuko.models.Contest.findById(req.param('id'), function(error, contest){
                    if( error ) return error.send(res);
                    if( !contest ){
                        return res.send({success: true});
                    }
                    return contest.remove(function(error){
                        if( error ) return error.send(res);
                        // success
                        return res.send({success: true});
                    });
                });
            }
        }
    },
    
    '/admin/themes/:game' : {
        get : {
            handler : function( req, res ){
                try{
                    return res.send( {items: Bozuko.games[req.param('game')].themes} );
                }catch(e){
                    console.error(e);
                    return res.send({items:[]});
                }
            }
        }
    },

    '/admin/winners' : {
        
        access: 'business',

        get : {
            handler : function(req, res){
                // check for contest or page
                var contest_id = req.param('contest_id'),
                    page_id = req.param('page_id'),
                    limit = req.param('limit') || 25,
                    offset = req.param('start') || 0,
                    search = req.param('search'),
                    updateOnly = req.param('updateOnly') || false,
                    selector = {}
                    ;

                if( contest_id ) selector['contest_id'] = contest_id;
                if( page_id ) selector['page_id'] = page_id;
                
                if( search ){
                    search = new RegExp('(^|\\s)'+XRegExp.escape(search), "i")
                    selector['$or'] = [
                        {'user_name': search},
                        {'name': search}
                    ];
                }
                
                return Bozuko.models.Prize.getLastUpdated(selector, function(error, lastUpdated){
                    if( error ) return error.send( res );

                    return Bozuko.models.Prize.find(selector, {}, {sort: {last_updated: -1}, limit: limit, skip: offset},function(error, prizes){
                        if( error ) return error.send(res);
                        
                        return Bozuko.models.Prize.count(selector, function(error, total){
                            
                            if( error ) return error.send( res );
                            
                            var user_ids = {};
                            prizes.forEach(function(prize){
                                user_ids[String(prize.user_id)] = true;
                            });
                            var page_ids = {};
                            prizes.forEach(function(prize){
                                page_ids[String(prize.page_id)] = true;
                            });
                            var contest_ids = {};
                            prizes.forEach(function(prize){
                                contest_ids[String(prize.contest_id)] = true;
                            });
    
                            // get the users
                            return Bozuko.models.User.find({_id: {$in: Object.keys(user_ids)}}, {'services.internal.friends':0,'services.internal.likes':0}, function(error, users){
                                if( error ) return error.send(res);
                                var user_map = {};
                                users.forEach(function(user){
                                    user_map[String(user._id)] = user;
                                });
    
                                // get the pages
                                return Bozuko.models.Page.find({_id: {$in: Object.keys(page_ids)}}, {name: 1, image: 1}, function(error, pages){
    
                                    var page_map = {};
                                    pages.forEach(function(page){
                                        page_map[String(page._id)] = page;
                                    });
                                    
                                    // get the contests
                                    return Bozuko.models.Contest.find({_id: {$in: Object.keys(contest_ids)}}, {name: 1}, function(error, contests){
    
                                        var contest_map = {};
                                        contests.forEach(function(contest){
                                            contest_map[String(contest._id)] = contest;
                                        });
    
                                        var winners = [];
                                        prizes.forEach(function(prize){
                                            
                                            var user = user_map[String(prize.user_id)];
                                            if( !user || !user.service || !user.service('facebook') ){
                                                console.error('User without a facebook account? '+user.name+' ('+user._id+')');
                                                return;
                                            }
                                            
                                            var filtered_user = filter(user_map[String(prize.user_id)],'_id','name','image','email');
                                            
                                            filtered_user.facebook_link = user_map[String(prize.user_id)].service('facebook').data.link;
                                            filtered_user.friend_count = user_map[String(prize.user_id)].service('facebook').internal.friend_count;
                                            
                                            
                                            
                                            // create a winner object
                                            winners.push({
                                                _id: prize.id,
                                                prize: filter(prize,'_id','timestamp','state','name','description','details','instructions','redeemed_time','expires','redeemed','consolation','is_barcode','is_email','email_code','barcode_image', 'last_updated'),
                                                user: filtered_user,
                                                page: filter(page_map[String(prize.page_id)], '_id', 'name','image'),
                                                contest: filter(contest_map[String(prize.contest_id)], '_id', 'name')
                                            });
                                        });
                                        return res.send({items:winners, total: total, last_updated: lastUpdated?filter(lastUpdated,'_id','last_updated'):null});
                                    });
                                });
                            });
                        });
                    });
                });
            }
        }
    },
    
    '/admin/entries' : {
        
        alias : '/admin/entries/:id',
        
        get : {
            handler: function(req, res){
                
                var page_id = req.param('page_id'),
                    contest_id = req.param('contest_id'),
                    limit = req.param('limit') || 25,
                    skip = req.param('start') || 0,
                    search = req.param('search') || false,
                    objects = {},
                    results = [],
                    total = 0
                    ;
                
                return async.series({
                    
                    entries : function(callback){
                        var selector = {};
                        
                        if( page_id ) selector.page_id = page_id;
                        if( contest_id ) selector.contest_id = contest_id;
                        
                        if( search ){
                            search = new RegExp('(^|\\s)'+XRegExp.escape(search), "i");
                            if( !page_id ){
                                selector['$or'] = [
                                    {user_name: search},
                                    {page_name: search},
                                ]
                            }
                            else{
                                selector.user_name = search;
                            }
                        }
                        
                        return Bozuko.models.Entry.find(selector, {}, {sort:{timestamp: -1}, limit: limit, skip: skip}, function(error, entries){
                            if( error ) return callback(error);
                            objects.entries = entries;
                            return Bozuko.models.Entry.count(selector, function(error, count){
                                if( error ) return error.send(res);
                                total = count;
                                return callback( null );
                            })
                            
                        });
                    },
                    
                    user : function(callback){
                        // create a user map
                        var ids = [];
                        objects.entries.forEach(function(entry){
                            if( !~ids.indexOf( entry.user_id ) ) ids.push(entry.user_id);
                        });
                        return Bozuko.models.User.find({_id: {$in: ids}}, {'services.internal.friends':0,'services.internal.likes':0}, {
                            phones: 0,
                            challenge: 0,
                            last_internal_update: 0,
                            manages: 0,
                            salt: 0,
                            token: 0
                        },function(error, users){
                            if( error ) return callback(error);
                            objects.users = users;
                            objects.user_map = array_map(users,'_id');
                            return callback(null);
                        });
                    },
                    
                    contests : function(callback){
                        // create a user map
                        var ids = [];
                        objects.entries.forEach(function(entry){
                            if( !~ids.indexOf( entry.contest_id ) ) ids.push(entry.contest_id);
                        });
                        return Bozuko.models.Contest.find({_id: {$in: ids}}, {
                            name: 1
                        },function(error, contests){
                            if( error ) return callback(error);
                            objects.contests = contests;
                            objects.contest_map = array_map(contests,'_id');
                            return callback(null);
                        });
                    },
                    
                    pages : function(callback){
                        // create a user map
                        var ids = [];
                        objects.entries.forEach(function(entry){
                            if( !~ids.indexOf( entry.page_id ) ) ids.push(entry.page_id);
                        });
                        return Bozuko.models.Page.find({_id: {$in: ids}}, {
                            name: 1 
                        },function(error, pages){
                            if( error ) return callback(error);
                            objects.pages = pages;
                            objects.page_map = array_map(pages,'_id');
                            return callback(null);
                        });
                    }
                    
                }, function finish(error){
                    if( error ) return error.send( res );
                    objects.entries.forEach(function(entry){
                        var result = filter(entry),
                            user = objects.user_map[String(entry.user_id)],
                            filtered_user = filter( user, 'name', 'image' )
                            ;
                        
                        result.user = filtered_user;
                        result.user.facebook_link = user.service('facebook').data.link;
                        result.user.friend_count = user.service('facebook').internal.friend_count;
                        result.contest = filter( objects.contest_map[String(entry.contest_id)], 'name' );
                        result.page = filter( objects.page_map[String(entry.page_id)], 'name' );
                        results.push(result);
                    });
                    return res.send({items: results, total: total});
                });
            }
        }
    },

    '/admin/contests/:id/publish' : {
        post : {
            handler : function(req,res){
                return Bozuko.models.Contest.findById(req.param('id'), function(error, contest){
                    if( error ) return error.send(res);
                    if( !contest ) return res.send({success: false});
                    return contest.publish(function(error){
                        if( error ) return error.send( res );
                        return res.send({success: true});
                    });
                });
            }
        }
    },

    '/admin/contests/:id/cancel' : {
        post : {
            handler : function(req,res){
                return Bozuko.models.Contest.findById(req.param('id'), function(error, contest){
                    if( error ) return error.send(res);
                    if( !contest ) return res.send({success: false});
                    return contest.cancel(function(error){
                        if( error ) return error.send( res );
                        return res.send({success: true});
                    });
                });
            }
        }
    },

    '/admin/report' : {

        get : {
            handler : function(req, res){
                
                var time = req.param('time') || 'week-1',
                    tzOffset = -1*parseInt(req.param('timezoneOffset', 0),10) / 60,
                    from, interval, now = new Date(), fillBlanks=true,
                    query = {},
                    options ={}
                    ;
                    
                // handle the timezoneoffset
                now.setHours(now.getHours() + -1*(parseInt(req.param('timezoneOffset', 0),10)/ 60) ); 
                    
                if( req.param('page_id') ){
                    query.page_id = new ObjectId(req.param('page_id'));
                }
                if( req.param('contest_id') ){
                    query.contest_id = new ObjectId(req.param('contest_id'));
                }
                
                time = time.split('-');
                if( time.length != 2 ) throw new Error('Invalid time argument');
                time[1] = parseInt( time[1], 10 );
                
                switch( time[0] ){
                    case 'year':
                        DateUtil.add( new Date(), DateUtil.DAY, -365 * time[1] );
                        from = new Date(now.getYear()-(time[1]),0,0);
                        fillBlanks = false;
                        interval = 'Month';
                        break;
                    case 'month':
                        from = DateUtil.add( new Date(), DateUtil.DAY, -30 * time[1] )
                        if( time[1] > 2 ){
                            fillBlanks = false;
                            interval = 'Month';
                        }
                        else{
                            interval = 'Date';
                        }
                        
                        break;
                    case 'week':
                        from = DateUtil.add( new Date(), DateUtil.DAY, -7 * time[1] )
                        interval = 'Date';
                        break;
                    case 'day':
                        from = DateUtil.add( new Date(), DateUtil.DAY, -1 * time[1] )
                        interval = 'Hours';
                        break;
                    case 'minute':
                        from = DateUtil.add( new Date(), DateUtil.MINUTE, -1 * time[1] )
                        interval = 'Minutes';
                        if( time[1] == 1 ){
                            interval = 'Seconds';
                        }
                        break;
                }
                
                var model = req.param('model') || 'Entry';
                if( !~['Prize','Redeemed Prizes','Entry','Play','Share','Checkins','Likes'].indexOf(model) ) throw "Invalid model";
                
                options = {
                    timezoneOffset: tzOffset,
                    interval: interval,
                    query: query,
                    fillBlanks: fillBlanks,
                    model: model,
                    from: from
                };
                
                if( model == 'Redeemed Prizes'){
                    options.model = "Prize";
                    query.redeemed = true;
                }
                else if(model == 'Share'){
                    options.countField = 'visibility';
                }
                else if( model == 'Likes'){
                    options.model = 'Share';
                    query.service = 'facebook';
                    query.type = 'like';
                }
                else if( model == 'Checkins'){
                    options.model = 'Share';
                    query.type = 'facebook';
                    query.type = 'checkin';
                }
                
                return Report.run( 'counts', options, function(error, results){
                    if( error ){
                        console.error(require('util').inspect(error));
                        return error.send( res );
                    }
                    return res.send( {items: results} );
                });
            }
        }

    }
};