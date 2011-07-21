exports.routes = {

    '/alive' : {
        get : {
            handler: function(req, res) {
                res.send({alive:true});
            }
        }
    },

    '/data' : {
        get: {
            handler: function(req, res) {
                res.send([]);
            }
        }
    }

};
