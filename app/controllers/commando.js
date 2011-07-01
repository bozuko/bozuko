var master;

exports.access = 'admin';

exports.beforeRoute = function(){
    var commando = require('commando');
    var options = require(process.env.HOME + '/.commando');
    options.nolisten = true;
    options.noAlert = true;
    commando.start(options);
    master = commando.master;
};

exports.routes = {

    '/commando/mongodb' : {
        get : {

            title: 'MongoDB Monitor',
            locals:{
                layout: false
            },
            handler: function(req, res) {
                if( req.device == 'touch' ) res.locals.layout = false;
                res.render('commando/mongodb');
            }
        }
    },

    '/commando/mongodb/collections': {
        get : {
            handler: function(req, res) {
                
                Object.keys(master.nodes).forEach(function(host) {
                    var collection_stats = master.nodes[host].data.mongodb.collection_stats;
                    res.send(JSON.stringify({collections: collection_stats}));
                });
            }
        }
    },

    '/commando/mongodb/db': {
        get : {
            handler: function(req, res) {
                var keys = Object.keys(master.nodes);
                for (var i = 0; i < keys.length; i++) {
                    var node = master.nodes[keys[i]];
                    if (node.data && node.data.mongodb) {
                        var db_stats = node.data.mongodb.db_stats;
                        return res.send(JSON.stringify({db_stats: db_stats}));
                    }
                };
                return res.send(JSON.stringify({db_stats: []}));
            }
        }
    }
};
