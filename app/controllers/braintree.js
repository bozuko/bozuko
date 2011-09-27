var BraintreeGateway = Bozuko.require('util/braintree');
var gateway = new BraintreeGateway();
var trData = gateway.createCustomerTrData();
var parse = require('url').parse;

exports.routes = {
    '/braintree' : {
        get: {
            handler: function(req, res) {
                var trData = gateway.createCustomerTrData('somerand'+Math.floor(Math.random()*1000));
                res.send(gateway.createCustomerForm(trData));
            }
        }
    },

    '/braintree/confirm' : {
        get: {
            handler: function(req, res) {
                gateway.confirmRedirect(parse(req.url).query, function(err, result) {
                    if (err) return res.send(err);
                    res.send(result);                    
                });
            }
        }
    }
};