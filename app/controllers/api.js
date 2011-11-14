exports.session = false;

exports.routes = {
    '/api' : {
        get : {
            handler: function(req, res) {
                var links = {
                    pages: "/pages",
                    bozuko: "/bozuko"
                };
                if (req.session.user) {
                    links.user = "/user",
                    links.prizes = "/prizes";
                } else {
                    links.login = "/user/login";
                }
                return Bozuko.transfer('entry_point', {links: links}, null, function(error, result){
                    return res.send( error || result );
                });
            }
        }
    }
};