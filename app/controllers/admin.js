var facebook    = Bozuko.require('util/facebook'),
    Page        = Bozuko.require('util/page'),
    qs          = require('querystring'),
    Dashboard   = require('./base/dashboard'),
    url         = require('url'),
    spawn       = require('child_process').spawn,
    Path        = require('path'),
    s3          = Bozuko.require('util/s3'),
    GD          = require('node-gd'),
    fs          = require('fs'),
    ObjectId    = require('mongoose').Types.ObjectId,
    filter      = Bozuko.require('util/functions').filter,
    merge       = Bozuko.require('util/functions').merge,
    array_map   = Bozuko.require('util/functions').map,
    Report      = Bozuko.require('core/report'),
    adminReporter = Bozuko.require('util/adminReporter'),
    DateUtil    = Bozuko.require('util/date'),
    XRegExp     = Bozuko.require('util/xregexp'),
    async       = require('async'),
    codePdf     = Bozuko.require('util/codePdf')
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
    
    '/admin/contests/:id/codes': {
        get: {
            handler: function(req, res) {
                codePdf.create(req.param('id'), function(err, pdf) {
                    if (err) return res.end(err.message);
                    res.contentType('application/pdf');
                    res.header('Content-Disposition', 'attachment; filename=codes.pdf');
                    res.end(pdf.output(),'binary');
                });
            }
        }
    },
    
    '/admin/contests/:id/adminReport': {
        get: {
            handler: function(req, res) {
               var self = this;
               var contest_id = req.param('id');
               if (!contest_id) return Bozuko.error('contest/not_found').send(res);
               return Bozuko.models.Contest.findById(contest_id, function(err, contest) {
                   if (err) return err.send(res);
                   if (!contest) return Bozuko.error('contest/not_found', contest_id).send(res);

                   // TODO: Allow report generation if this user is a Bozuko employee 
                   // How do we do this? 
                   var allowed = true;
                   if (!allowed) return Bozuko.error('bozuko/auth').send(res);
                   return adminReporter.stream(contest, res);
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

                var test = false;

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
                });
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

    '/admin/page/:id/admins' : {
        alias : '/admin/page/:id/admins/:user_id',
        get : {
            handler : function(req, res){
                // get the page
                Bozuko.models.Page.findById(req.param('id'), function(error, page){
                    if( error ) return error.send(res);
                    return Bozuko.models.User.find({_id: {$in: page.admins}}, {name:1,image:1,_id:1}, function(error, users){
                        if( error ) return error.send(res);
                        return res.send(users);
                    });
                });
            }
        },

        post : {
            handler : function(req, res){
                if( !req.param('user_id') ) (new Error('No user')).send(res);
                Bozuko.models.Page.findById(req.param('id'), function(error, page){
                    if( error ) return error.send(res);
                    return Bozuko.models.User.findById( req.param('user_id'), function(error, user){
                        if( error ) return error.send(res);
                        return page.addAdmin( user, function(error){
                            if( error ) return error.send(res);
                            return res.send({success:true});
                        });
                    });
                });
            }
        },
        del : {
            handler : function(req, res){
                if( !req.param('user_id') ) (new Error('No user')).send(res);
                Bozuko.models.Page.findById(req.param('id'), function(error, page){
                    if( error ) return error.send(res);
                    return Bozuko.models.User.findById( req.param('user_id'), function(error, user){
                        if( error ) return error.send(res);
                        return page.removeAdmin( user, function(error){
                            if( error ) return error.send(res);
                            return res.send({success:true});
                        });
                    });
                });
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
                    limit = req.param('limit') || 25,
                    exclude = req.param('exclude')
                    ;

                if( search ){
                    selector.name = new RegExp('(^|\\s)'+XRegExp.escape(search), "i");
                }
                if( exclude ){
                    selector._id = {$nin: exclude.split(',')};
                }
                switch( user_filter ){
                    case 'blocked':
                        /*
                        selector.$or = [
                            {allowed: false},
                            {allowed: {$exists: false}}
                        ];
                        selector.blocked = true;
                        */
                        selector.$and = [{
                            $or: [
                                {allowed: false},
                                {allowed: {$exists: false}}
                            ]
                        },{
                            $or: [
                                {blocked: true},
                                {soft_block: true}
                            ]
                        }];
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
                    user.soft_block = false;
                    user.allowed = true;
                    return user.save(function(error){
                        if( error ) return error.send(res);
                        return res.send({success:true});
                    });
                });
            }
        }
    },
    
    '/admin/users/:id/friends.csv' : {
        get : {
            handler : function(req, res){
                res.header('Content-Type', 'text/csv');
                // res.header('Content-Type', 'text/plain');
                // get the user
                return Bozuko.models.User.findById(req.param('id'), function(error, user){
                    if( error ){
                        console.error(error);
                        return res.send(error.message);
                    }
                    if( !user ){
                        return res.send('No User Found');
                    }
                    var name = user.name.replace(/"/, '\\"');
                    res.header('Content-Disposition', 'attachment; filename="'+name+' Friends.csv"');
                    var first = [user.service('facebook').sid, '"'+user.name+'"', 'http://facebook.com/profile.php?id='+user.service('facebook').sid];
                    res.write( first.join(',')+'\n');
                    var friends = user.service('facebook').internal.friends;
                    
                    friends.forEach(function(friend){
                        console.log(friend);
                        var row = [
                            friend.id,
                            '"'+friend.name+'"',
                            'http://facebook.com/profile.php?id='+friend.id
                        ];
                        res.write(row.join(',')+'\n');
                    });
                    
                    return res.end();
                });
            }
        }
    },

    '/admin/places' : {

        get : {
            handler : function(req, res){
                var options = {}
                  , fn = 'search'
                  ;
                  
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
                    
                    if( options.query && options.query.match(/^\//) || options.query.match(/https?\:\/\/www\.facebook\.com\//) ){
                        var id = options.query.replace( /^(https?\:\/\/www\.facebook\.com)?\//, '');
                        // we are going to try try and
                        options = {place_id: id};
                        fn = 'place';
                    }
                    
                }
                if( fn === 'search' && Object.keys( options ).length === 0 ){
                    return res.send( {items:[]} );
                }
                return Bozuko.service('facebook')[fn](options, function(error, places){
                    if( error ) return error.send( res );
                    
                    
                    if( !places.forEach ) places = [places];
                    
                    
                    
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
    },

    // This adds pins to all pages that don't have them. It only needs to be used once, since new pages
    // will automatically get pins when created.
    //
    '/admin/pages/add_pins': {
        get: {
            handler: function(req, res) {
                return Bozuko.models.Page.find({pin: {$exists: false}}, {_id: 1}, function(err, pages) {
                    return async.forEachSeries(pages, function(page, callback) {
                        return Bozuko.models.Page.getPin(function(err, pin) {
                            if (err) return callback(err);
                            return Bozuko.models.Page.update({_id: page._id}, {$set: {pin: pin}}, callback);
                        });
                    }, function(err) {
                        if (err) res.send(err);
                        res.send('DONE!');
                    });
                });
            }
        }
    },

    '/admin/export' : {
        post : {
            handler : function(req, res){
                console.log(req.param('body'));
                var body = JSON.parse(req.param('body')),
                    name = body.name.replace(/"/, '\\"');

                res.contentType('application/json');
                res.header('content-disposition', 'attachment; filename="'+name+'.json"');
                return res.send( body );
            }
        }
    },
    
    '/admin/apikey/:id?' : {
        get : {
            handler : function(req, res){
                Bozuko.models.Apikey.find({}, {}, {sort: {timestamp:-1}}, function(err, keys){
                    res.send(keys);
                });
            }
        },
        
        post : {
            handler : function(req, res){
                
                var data = {
                    name: req.param('name'),
                    key: req.param('key'),
                    description: req.param('description')
                }, key = new Bozuko.models.Apikey(data);
                console.log(data);
                key.save(function(err){
                    return res.send({success: !err, items:[key]});
                });
            }
        },
        
        put : {
            handler : function(req, res){
                Bozuko.models.Apikey.findById(req.param('_id'), function(err, key){
                    if(err) return res.send({success:false});
                    var data = {
                        name: req.param('name'),
                        key: req.param('key'),
                        description: req.param('description')
                    };
                    console.log(data);
                    key.set(data);
                    return key.save(function(err){
                        return res.send({success: !err, items: [key]});
                    });
                });
            }
        },
        
        del : {
            handler : function(req, res){
                Bozuko.models.Apikey.findById(req.param('_id'), function(err, key){
                    if(err) return res.send({success:false});
                    return key.remove(function(err){
                        return res.send({success: !err});
                    });
                });
            }
        }
    }
    /*
    '/admin/build-circles' : {
        get :{
            handler : function(req, res){

                var radius = parseInt(req.param('radius')||40,10),
                    diameter = radius*2,
                    i = 0;

                function rgb(percent){
                    var r,g,b;
                    if( percent < .25 ){
                        r=29,g=177,b=53;
                    }
                    else if( percent < .50 ){
                        r=227,g=244,b=31;
                    }
                    else if( percent < .75 ){
                        r=255,g=127,b=0;
                    }
                    else{
                        r=255,g=0,b=0;
                    }
                    return ['rgba('+r,g,b,'.5)'].join(',');
                }

                async.whilst(function(){ return i < 101; }, function(cb){
                    var canvas = new Canvas(diameter, diameter),
                        percent = (i/100),
                        ctx = canvas.getContext('2d');

                    ctx.beginPath();
                    ctx.fillStyle = '#ffffff';
                    ctx.moveTo(radius,radius);
                    ctx.arc(radius,radius,radius,Math.PI * (-0.5 + 2 * 0), Math.PI * (-0.5 + 2 * 1), false);
                    ctx.moveTo(radius,radius);
                    ctx.closePath();
                    ctx.fill();
                    ctx.beginPath();
                    ctx.fillStyle = rgb(percent);
                    ctx.moveTo(radius,radius);
                    ctx.arc(radius,radius,radius,Math.PI * (-0.5 + 2 * 0), Math.PI * (-0.5 + 2 * percent), false);
                    ctx.moveTo(radius,radius);
                    ctx.closePath();
                    ctx.fill();
                    ctx.beginPath();
                    ctx.strokeStyle = '#e0e0e0';
                    ctx.arc(radius,radius,radius,0,Math.PI*2, false);
                    ctx.closePath();
                    ctx.stroke();
                    ctx.moveTo(radius,radius);

                    var stream = canvas.createPNGStream(),
                        tmpFile = Bozuko.dir+'/tmp/circle-'+i+'.png',
                        tmp = fs.createWriteStream(tmpFile);

                    i++;

                    stream.on('data', function(chunk){
                        tmp.write(chunk,'binary');
                    });
                    stream.on('end', function(){
                        // okay, lets put the file in s3...
                        s3.client.putFile(tmpFile, '/public/circles/'+Path.basename(tmpFile), {'x-amz-acl': 'public-read'}, function(error, response){
                            if( error ) return cb(error);
                            fs.unlinkSync(tmpFile);
                            return cb();
                        });
                    });

                }, function(error){
                    // tell the browser its all good...
                    if( error ) return res.send('there was an error dog...');
                    return res.send('circles created');
                });

            }
        }
    }
    */
};

Dashboard.addRoutes( exports, '/admin' );
