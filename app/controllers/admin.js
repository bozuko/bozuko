var facebook    = Bozuko.require('util/facebook'),
    http        = Bozuko.require('util/http'),
    Page        = Bozuko.require('util/page'),
    qs          = require('querystring'),
    url         = require('url'),
    spawn       = require('child_process').spawn,
    sys         = require('sys')
;

exports.access = 'admin';

exports.routes = {
    
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
                return Bozuko.models.Page.find({},{},{sort:{name:1}}, function(error, pages){
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
                    page.set( req.body );
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
                return Bozuko.models.Contest.find(selector,{},{sort:{active: -1, start:-1}}, function(error, pages){
                    if( error ) return error.send(res);
                    return res.send({items:pages});
                });
            }
        },
        
        post : {
            handler : function(req, res){
                
                req.body.entry_config = [{
                    tokens: 3,
                    type: 'facebook/checkin',
                    enable_like: true,
                    like_tokens: 3
                }];
                delete req.body._id;
                var contest = new Bozuko.models.Contest(req.body);
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
                    contest.set( req.body );
                    return contest.save( function(error){
                        if( error ) return error.send( res );
                        return res.send( {items: [contest]} );
                    });
                });
            }
        },
        
        del : {
            // delete the record
            handler : function(req,res){
                res.send({success:false, message:'not implemented'});
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