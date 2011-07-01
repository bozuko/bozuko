exports.access = 'admin';

var mycroft = require('commando').mycroft;
var options = require(process.env.HOME + '/.commando').mycroft;
mycroft.start(options);

exports.routes = {

    '/mycroft/mongodb' : {
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

    '/mycroft/mongodb/db': {
        get : {
            handler: function(req, res) {
                var keys = Object.keys(mycroft.nodes);
                for (var i = 0; i < keys.length; i++) {
                    var node = mycroft.nodes[keys[i]];
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
