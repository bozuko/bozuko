var facebook    = Bozuko.require('util/facebook'),
    Page        = Bozuko.require('util/page'),
    qs          = require('querystring'),
    url         = require('url'),
    spawn       = require('child_process').spawn,
    sys         = require('sys'),
    merge       = Bozuko.require('util/merge')
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
    
    '/events' : {
        get : {
            handler: function(req, res){
                res.contentType = 'text/html';
                res.write([
                    '<html><head><style>',
                    'body{font-family: Tahoma; font-size: 12px; }',
                    '.entries{ border-top: 1px solid #ccc; }',
                    '.entry{ border-bottom: 1px solid #ccc; clear: both; overflow: hidden; }',
                    '.entry-odd{ background: #f3f3f3; }',
                    '.entry-title{ width: 200px; float: left; font-weight: bold; }',
                    '.entry-content{ margin-left: 210px; }',
                    '</style>',
                    '<script type="text/javascript">',
                    'var count=0;',
                    'function log(msg,type,time){',
                        'var div = document.createElement("div");',
                        'div.className = "entry";',
                        'if( count++ % 2) div.className+=" entry-odd";',
                        'div.innerHTML = \'<div class="entry-title"><h3>\'+type+\'</h3><div class="date">\'+time+\'</div></div>\'',
                        'div.innerHTML+= \'<div class="entry-content">\'+JSON.stringify(msg)+\'</div>\'',
                        'document.getElementById("logs").insertBefore(div, document.getElementById("first").nextSibling);',
                    '}',
                    '</script>',
                    '<title>Event Viewer</title>',
                    '<body>',
                    '<h1>Event Logger</h1>',
                    '<div id="logs" class="entries"><div id="first"></div><div id="last"></div>',
                    ].join('\n'));
                
                var logger = function(msg, type, timestamp){
                    res.write([
                        '<script type="text/javascript">',
                        'log('+JSON.stringify(msg)+','+JSON.stringify(type)+','+JSON.stringify(timestamp)+')',
                        '</script>'
                    ].join(''));
                };
                
                Bozuko.subscribe('*', logger);
                req.connection.addListener('close', function(){
                    Bozuko.unsubscribe('*', logger);
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
                res.render('admin/index');
            }
        }
    },

    '/admin/places' : {

        get : {
            handler : function(req, res){
                var ll = (req.param('ll') || '').split(',');
                if( ll.length !== 2 ){
                    new Error('Invalid ll').send(res);
                }
                ll.reverse();
                return Bozuko.service('facebook').search({
                    center: ll
                }, function(error, places){
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
                Bozuko.models.User.find({},{},{sort:{name:1}}, function(error, users){
                    if( error ) error.send( res );
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

        get : {
            handler : function(req, res){
                // need to get all pages
                var page_id = req.param('page_id'),
                    selector = {};

                if( page_id ) selector['page_id'] = page_id;
                return Bozuko.models.Contest.find(selector,{},{sort:{active: -1, start:-1}}, function(error, contests){
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
                delete data.total_entries;
                delete data.total_plays;
                
                prizes.forEach(function(prize){
                    delete prize._id;
                });
                
                // any other _id things?
                consolation_prizes.forEach(function(prize){
                    delete prize._id;
                });
                
                var contest = new Bozuko.models.Contest(data);
                console.log(JSON.stringify(contest));
                return contest.save( function(error){
                    if( error ) return error.send( res );
                    return res.send({items:[contest]});
                });
            }
        }
    },

    '/admin/contests/:id' : {

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

        get : {
            handler : function(req, res){
                // check for contest or page
                var contest_id = req.param('contest_id'),
                    page_id = req.param('page_id'),
                    limit = req.param('limit') || 25,
                    offset = req.param('offset') || 0,
                    updateOnly = req.param('updateOnly') || false;
                    selector = {}
                    ;
                    
                if( contest_id ) selector['contest_id'] = contest_id;
                if( page_id ) selector['page_id'] = page_id;
                
                return Bozuko.models.Prize.getLastUpdated(selector, function(error, lastUpdated){
                    if( error ) return error.send( res );
                    
                    return Bozuko.models.Prize.find(selector, {}, {sort: {timestamp: -1}, limit: limit, skip: offset},function(error, prizes){
                        if( error ) return error.send(res);
                        
                        var user_ids = {};
                        prizes.forEach(function(prize){
                            user_ids[String(prize.user_id)] = true;
                        });
                        // get the users
                        return Bozuko.models.User.find({_id: {$in: Object.keys(user_ids)}}, function(error, users){
                            if( error ) return error.send(res);
                            var user_map = {};
                            users.forEach(function(user){
                                user_map[String(user._id)] = user;
                            });
                            
                            var winners = [];
                            prizes.forEach(function(prize){
                                // create a winner object
                                winners.push({
                                    _id: prize.id,
                                    prize: filter(prize,'_id','timestamp','state','name','description','details','instructions','redeemed_time','expiration_time','redeemed','consolation','is_barcode','is_email','email_code','barcode_image', 'last_updated'),
                                    user: filter(user_map[String(prize.user_id)],'_id','name','image','email')
                                });
                            });
                            return res.send({items:winners, last_updated: lastUpdated?filter(lastUpdated,'_id','last_updated'):null});
                        });
                    });
                });
            }
        },
        
        post : {
            handler: function(req,res){
                // check for contest or page
                var contest_id = req.param('contest_id'),
                    page_id = req.param('page_id'),
                    previous = req.param('last_updated'),
                    selector = {},
                    closed = false,
                    start = (new Date()).getTime(),
                    /**
                     * One minute timeouts
                     */
                    timeout = 60000,
                    count = 0,
                    interval = Bozuko.config.admin.winners_list.poll_interval = 200
                    ;
                    
                if( contest_id ) selector['contest_id'] = contest_id;
                if( page_id ) selector['page_id'] = page_id;
                
                if( previous ){
                    previous.last_updated = new Date( Date.parse(previous.last_updated) );
                }
                
                req.connection.addListener('close', function(){
                    closed = true;
                });
                
                var lookForUpdates = function(){
                    var now = (new Date()).getTime();
                    if( closed || start+timeout < now ) return res.send({update: false, last_updated: previous});
                    
                    return Bozuko.models.Prize.getLastUpdated(selector, function(error, lastUpdated){
                        if( error ) return error.send(res);
                        if( !lastUpdated && !previous ) return setTimeout( lookForUpdates, interval);
                        if( (lastUpdated && !previous) || String(lastUpdated._id) != previous._id || previous.last_updated.getTime() !== lastUpdated.last_updated.getTime() ){
                            return res.send( {update: true, last_updated: filter(lastUpdated,'_id','last_updated')} );
                        }
                        return setTimeout( lookForUpdates, interval);
                    });
                }
                return lookForUpdates();
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
    }
};

function filter(data){
    
    if( arguments.length > 1 ){
        var tmp={};
        [].slice.call(arguments,1).forEach(function(field){
            tmp[field] = data[field];
        });
        data = tmp;
    }
    
    if( Array.isArray(data)){
        data.forEach(function(item){filter(item);});
    }
    else if( data && 'object' === typeof data ){
        Object.keys(data).forEach(function(key){
            if( ~key.indexOf('.') ){
                delete data[key];
            }
            else{
                data[key] = filter(data[key]);
            }
        });
    }
    return data;
}