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
    async       = require('async')
;

exports.access = 'admin';

exports.routes = {

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
    }
};