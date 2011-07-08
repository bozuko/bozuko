var facebook    = Bozuko.require('util/facebook'),
    Page        = Bozuko.require('util/page'),
    qs          = require('querystring'),
    url         = require('url'),
    spawn       = require('child_process').spawn,
    sys         = require('sys'),
    ObjectId    = require('mongoose').Types.ObjectId,
    filter      = Bozuko.require('util/functions').filter,
    merge       = Bozuko.require('util/functions').merge,
    Report      = Bozuko.require('core/report'),
    DateUtil    = Bozuko.require('util/date')
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

    '/admin/stats/play' : {

        alias: '/admin/playstats',

        get : {

            title: 'Play Stats',
            locals:{
                layout: false
            },

            handler: function(req,res){
                Bozuko.models.User.find({name:/(bozuko|fabrizio)/ig}, {_id:1}, function(error, users){
                    var ids = [];
                    users.forEach(function(user){ ids.push(user._id); });
                    Bozuko.models.Play.count({user_id: {$nin: ids}}, function(error, outside_count){
                        Bozuko.models.Play.count({user_id: {$in: ids}}, function(error, inside_count){
                            res.contentType = 'text/plain';
                            res.write([
                                'Outside Bozuko Plays:  '+outside_count,
                                'Inside Bozuko Plays:   '+inside_count,
                            ].join('\n'));
                            res.end();
                        });
                    });
                });
            }
        }
    },

    '/admin/stats/entry' : {

        get : {

            title: 'Entry Stats',
            locals:{
                layout: false
            },

            handler: function(req,res){
                Bozuko.models.User.find({name:/(bozuko|fabrizio)/ig}, {_id:1}, function(error, users){
                    var ids = [];
                    users.forEach(function(user){ ids.push(user._id); });
                    Bozuko.models.Entry.count({user_id: {$nin: ids}}, function(error, outside_count){
                        Bozuko.models.Entry.count({user_id: {$in: ids}}, function(error, inside_count){
                            res.contentType = 'text/plain';
                            res.write([
                                'Outside Bozuko Entries:  '+outside_count,
                                'Inside Bozuko Entries:   '+inside_count,
                            ].join('\n'));
                            res.end();
                        });
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
                Bozuko.models.User.find({},{},{sort:{name:1},limit: 50}, function(error, users){
                    if( error ) return error.send( res );
                    return res.send( {items: users} );
                });
            }
        }
    },

    '/admin/addpage':{

        post : {
            handler : function(req, res){
                // need a facebook id and a user_id
                var user_id = req.param('user_id'),
                    place_id = req.param('place_id');

                if( !user_id || !place_id ){
                    return new Error('No user or no place').send( res );
                }

                return Bozuko.service('facebook').place({place_id: place_id}, function(error, place){
                    if( error ) return error.send(res);
                    // now we want to create a new place...
                    return Bozuko.models.Page.createFromServiceObject( place, function(error, page){
                        if( error ) return error.send(res);
                        if( !page ) return new Error('weird problem creating place');
                        page.owner_id = user_id;
                        return page.save(function(error){
                            if( error ) return error.send( res );
                            return res.send(page);
                        });
                    });
                });
            }
        }

    },

    '/admin/pages' : {

        get : {
            handler : function(req, res){
                // need to get all pages
                return Bozuko.models.Page.find({owner_id:{$exists:true}},{},{sort:{name:1}}, function(error, pages){
                    if( error ) return error.send(res);
                    return res.send({items:pages});
                });
            }
        }
    },

    'admin/pages/:id' : {

        /* update */
        put : {
            handler : function(req,res){
                return Bozuko.models.Page.findById( req.param('id'), function(error, page){
                    if( error ) return error.send( res );
                    // else, lets bind the reqest to the page
                    var data = req.body;

                    delete data._id;
                    page.set( data );
                    return page.save( function(error){
                        if( error ) return error.send(res);
                        return res.send( {items: [page]} );
                    });
                })
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
                if( req.param('id') ) selector['id'] = req.param('id');
                return Bozuko.models.Contest.find(selector,{results:0, plays:0},{sort:{active: -1, start:-1}}, function(error, contests){
                    if( error ) return error.send(res);
                    contests.sort(function(a,b){
                        if( a.state=='active' && b.state != 'active' ) return -1;
                        if( b.state=='active' && a.state != 'active' ) return 1;
                        return +b.start-a.start;
                    });
                    var ret = [];
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
                delete data.total_entries;
                delete data.total_plays;

                prizes.forEach(function(prize){
                    delete prize._id;
                });
                
                
                // any other _id things?
                consolation_prizes.forEach(function(prize){
                    delete prize._id;
                });
                
                
                var contest = new Bozuko.models.Contest();
                contest.set(data);
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
                            doc = old.doc;
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
                            doc = old.doc;
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

    '/admin/winners' : {
        
        access: 'business',

        get : {
            handler : function(req, res){
                // check for contest or page
                var contest_id = req.param('contest_id'),
                    page_id = req.param('page_id'),
                    limit = req.param('limit') || 25,
                    offset = req.param('offset') || 0,
                    updateOnly = req.param('updateOnly') || false,
                    selector = {}
                    ;

                if( contest_id ) selector['contest_id'] = contest_id;
                if( page_id ) selector['page_id'] = page_id;
                
                return Bozuko.models.Prize.getLastUpdated(selector, function(error, lastUpdated){
                    if( error ) return error.send( res );

                    return Bozuko.models.Prize.find(selector, {}, {sort: {last_updated: -1}, limit: limit, skip: offset},function(error, prizes){
                        if( error ) return error.send(res);

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
                        return Bozuko.models.User.find({_id: {$in: Object.keys(user_ids)}}, function(error, users){
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
                                        // create a winner object
                                        winners.push({
                                            _id: prize.id,
                                            prize: filter(prize,'_id','timestamp','state','name','description','details','instructions','redeemed_time','expires','redeemed','consolation','is_barcode','is_email','email_code','barcode_image', 'last_updated'),
                                            user: filter(user_map[String(prize.user_id)],'_id','name','image','email'),
                                            page: filter(page_map[String(prize.page_id)], '_id', 'name','image'),
                                            contest: filter(contest_map[String(prize.contest_id)], '_id', 'name')
                                        });
                                    });
                                    return res.send({items:winners, last_updated: lastUpdated?filter(lastUpdated,'_id','last_updated'):null});
                                });
                            });
                        });
                    });
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

    '/admin/browser' : {

        aliases: ['/browser'],
        get : {
            locals : {
                title: 'Api Browser',
                layout: false
            },
            handler : function(req, res){

                var transfer_objects = {};
                var links = {};
                Object.keys(Bozuko.transfers()).forEach(function(key){
                    var transfer = Bozuko.transfer(key);
                    transfer_objects[key] = {
                        doc: transfer.doc,
                        def: transfer.def
                    }
                });
                Object.keys(Bozuko.links()).forEach(function(key){
                    var link = Bozuko.link(key);

                    var methods = {};
                    Object.keys(link.methods).forEach(function(key){
                        var method = link.methods[key];
                        methods[key] = {
                            method: method.method,
                            access: method.access,
                            params: method.params,
                            returns: method.returns,
                            doc: method.doc
                        }
                    });

                    links[key] = {
                        title: link.title,
                        name: link.name,
                        methods: methods
                    };
                });

                Bozuko.models.User.find({}, function(error, users){
                    res.locals.transfer_objects = JSON.stringify(transfer_objects);
                    res.locals.links = JSON.stringify(links);
                    res.locals.users = JSON.stringify(users);

                    res.render('admin/browser');
                });

            }
        }
    },

    '/admin/report-test':{
        get : {
            handler : function(req, res){
                Report.run('counts', {
                    model: 'Entry',
                    type: 'filter',
                    field: 'hour',
                    mapFn: function(){
                        emit( this.timestamp.getHours(), {hour: this.timestamp.getHours(), count:1, avg: 1, min: 1, max: 1});
                    },
                    reduceFn :function(key, values){
                        var min = 0, max = 0, avg = 0;
                    },
                    // from: DateUtil.add( new Date(), DateUtil.DAY, -80),
                    interval: 'Date'
                }, function(error, results){
                    if( error ) error.send( res );
                    return res.send( results );
                });
            }
        }
    },

    '/admin/report' : {

        get : {
            handler : function(req, res){
                
                var time = req.param('time') || 'week-1',
                    from, interval, now = new Date(),
                    query = {
                    };
                    
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
                        from = DateUtil.add( new Date(), DateUtil.DAY, -365 * time[1] )
                        interval = 'Date';
                        break;
                    case 'month':
                        from = DateUtil.add( new Date(), DateUtil.DAY, -30 * time[1] )
                        interval = 'Date';
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
                if( !~['Prize','Redeemed Prizes','Entry','Play'].indexOf(model) ) throw "Invalid model";
                
                if( model == 'Redeemed Prizes'){
                    model = "Prize";
                    query.redeemed = true;
                }
                
                return Report.run('counts',
                
                {
                    interval: interval,
                    query: query,
                    model: model,
                    from: from
                },
                
                function(error, results){
                    if( error ) return error.send( res );
                    return res.send( {items: results} );
                });
            }
        }

    }
};