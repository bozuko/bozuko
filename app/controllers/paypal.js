var inspect = require('util').inspect;
var http = Bozuko.require('util/http');

exports.routes = {
    '/ipn': {
        post: {
            handler: function(req, res) {
                if (Bozuko.env() === 'playground') {
                    http.request({
                        url: 'https://playground.bozuko.com:8004/ipn',
                        method: 'POST',
                        headers: req.headers,
                        body: req.rawBody
                    }, function() {
                        console.log("Proxied IPN req to dev because Paypal sucks");
                        res.end();
                    });
                } else {
                    console.log("IPN = "+inspect(req));
                }
            }
        }
    }
};