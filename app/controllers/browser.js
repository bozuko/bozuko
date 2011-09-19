var facebook    = Bozuko.require('util/facebook'),
    Page        = Bozuko.require('util/page'),
    qs          = require('querystring'),
    url         = require('url'),
    spawn       = require('child_process').spawn,
    sys         = require('sys'),
    ObjectId    = require('mongoose').Types.ObjectId,
    filter      = Bozuko.require('util/functions').filter,
    merge       = Bozuko.require('util/functions').merge,
    array_map   = Bozuko.require('util/functions').map,
    Report      = Bozuko.require('core/report'),
    DateUtil    = Bozuko.require('util/date'),
    async       = require('async'),
    XRegExp     = Bozuko.require('util/xregexp')
;

exports.access = 'admin';

exports.routes = {

    '/browser' : {

        aliases: ['/admin/browser','/browser/index'],
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
                    };
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
                
                return Bozuko.models.User.find({}, {}, {limit:24}, function(error, users){
                    res.locals.transfer_objects = JSON.stringify(transfer_objects);
                    res.locals.links = JSON.stringify(links);
                    res.locals.users = JSON.stringify(users);

                    res.render('admin/browser');
                });

            }
        }
    },
    
    '/browser/users' : {

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
    }
};