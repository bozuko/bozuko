var braintree = require('braintree');

var BraintreeGateway = module.exports = function() {
    this.gateway = braintree.connect(Bozuko.config.braintree);
};

BraintreeGateway.prototype.createCustomerTrData = function() {
    var trData = this.gateway.transparentRedirect.createCustomerData({
        redirectUrl: 'https://'+Bozuko.config.server.host+':'+Bozuko.config.server.port+'/braintree/confirm',
        customer: {
            id: '12345679090'
        }
    });
    return trData;
};

// This is just for experimentation. It will be a view in production.
BraintreeGateway.prototype.createCustomerForm = function(trData) {
    var url = 'https://sandbox.braintreegateway.com'+this.gateway.transparentRedirect.url;
    var str = "<html><body>"+
        "<form action=\""+url+"\" method=\"post\">" +
        "<input type=\"hidden\" name=\"tr_data\" value=\""+trData+"\"/>"+
        "<p>First Name: <input type=\"text\" name=\"customer[first_name]\""+"/></p>"+
        "<p>Last Name: <input type=\"text\" name=\"customer[last_name]\""+"/></p>"+
        "<p>Email: <input type=\"text\" name=\"customer[email]\""+"/></p>"+
        "<p>Card Number: <input type=\"text\" name=\"customer[credit_card][number]\""+"/></p>"+
        "<p>Expiration Date<input type=\"text\" name=\"customer[credit_card][expiration_date]\""+"/></p>"+        
        "<p>Name on Card: <input type=\"text\" name=\"customer[credit_card][cardholder_name]\""+"/></p>"+
        "<p>cvv2: <input type=\"text\" name=\"customer[credit_card][cvv]\""+"/></p>"+
        "<input type=\"submit\" name=\"Submit\" value=\"Submit\"/>"+
        "</form></body></html>";

    return str;
};

BraintreeGateway.prototype.confirmRedirect = function(querystring, cb) {
    this.gateway.transparentRedirect.confirm(querystring, cb);
};