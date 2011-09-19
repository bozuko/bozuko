var testsuite = require('./config/testsuite');
var BraintreeGateway = Bozuko.require('util/braintree');
var inspect = require('util').inspect;

var customer;
var cc_token;

exports['create customer'] = function(test) {
    customer = new Bozuko.models.Customer({
        firstName: 'Murray',
        lastName: 'Rothbard',
        company: 'UNLV',
        email: 'rothbard@unlv.edu'        
    });
    customer.save(function(err) {
        test.ok(!err);
        test.done();
    });
};

// DO NOT EVER do this on a production system. This is only for tests. 
// We must use Transparent Redirect (TR) to remain PCI compliant.
exports['create credit card'] = function(test) {
    var gateway = new BraintreeGateway().gateway;
    gateway.creditCard.create({
        customerId: customer.bt_id,
        number: "5105105105105100",
        expirationDate: "05/2014",
        cardholderName: 'Murray N. Rothbard'
    }, function(err, result) {
        test.ok(!err);
        test.ok(result.success);
        cc_token = result.creditCard.token;
        test.done();
    });
};

exports['create subscription'] = function(test) {
    customer.createSubscription({
        paymentMethodToken: cc_token,
        planId: 'monthly_subscription'
    }, function(err, result) {
        test.ok(!err);
        test.done();
    });
};

exports['remove customer'] = function(test) {
    var gateway = new BraintreeGateway().gateway;
    gateway.customer.delete(customer.bt_id, function(err, result) {
        test.ok(!err);
        customer.remove(function(err) {
            test.ok(!err);
            test.done();
        });
    });
};