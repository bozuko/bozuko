var testsuite = require('./config/testsuite');
var BraintreeGateway = Bozuko.require('util/braintree');
var inspect = require('util').inspect;

var customer, 
    cc_token,
    page
;

exports['create page'] = function(test) {
    page = new Bozuko.models.Page();
    page.active = true;
    page.name = "Murray's Page";
    page.save(function(err) {
        test.ok(!err);
        test.done();
    });
};

exports['create customer'] = function(test) {
    Bozuko.models.Customer.create({
        page_id: page._id,
        firstName: 'Murray',
        lastName: 'Rothbard',
        company: 'UNLV',
        email: 'rothbard@unlv.edu'
    }, function(err, newCustomer) {
        test.ok(!err);
        test.ok(newCustomer);
        customer = newCustomer;
        test.done();
    });
};

exports['create same customer - fail'] = function(test) {
    Bozuko.models.Customer.create({
        page_id: page._id,
        firstName: 'Murray',
        lastName: 'Rothbard',
        company: 'UNLV',
        email: 'rothbard@unlv.edu'
    }, function(err, newCustomer) {
        test.ok(err);
        test.done();
    });
};

exports['find customer'] = function(test) {
    Bozuko.models.Customer.findByGatewayId(page._id, function(err, result) {
        test.ok(!err);
        test.done();
    });
};

// DO NOT EVER do this on a production system. This is only for tests. 
// We must use Transparent Redirect (TR) to remain PCI compliant.
exports['create credit card'] = function(test) {
    var gateway = new BraintreeGateway().gateway;
    gateway.creditCard.create({
        customerId: String(customer.page_id),
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

// If the user wants to update their subscriptions/cc info we must retrieve it all from braintree.
// We don't store it in mongo.
exports['find customer - retrieve credit card token'] = function(test) {
    Bozuko.models.Customer.findByGatewayId(customer.page_id, function(err, result) {
        test.ok(!err);
        test.deepEqual(cc_token, result.creditCards[0].token);
        test.done();
    });
};

exports['create active subscription'] = function(test) {
    customer.createActiveSubscription({
        paymentMethodToken: cc_token,
        planId: 'monthly_subscription'
    }, function(err, result) {
        test.ok(!err);
        test.done();
    });
};

exports['create another active subscription - fail'] = function(test) {
    customer.createActiveSubscription({
        paymentMethodToken: cc_token,
        planId: 'monthly_subscription'
    }, function(err, result) {
        test.ok(err);
        test.done();
    });
};

exports['cancel active subscription'] = function(test) {
    customer.cancelActiveSubscription(function(err, result) {
        test.ok(!err);
        test.done();
    });
};

exports['cancel active subscription again - fail'] = function(test) {
    customer.cancelActiveSubscription(function(err, result) {
        test.ok(err);
        test.done();
    });
};


// Not sure we actually ever want to remove customers. We may just want to cancel subscriptions.
// So just do it from the test for cleanup.
exports['remove customer'] = function(test) {
    var gateway = new BraintreeGateway().gateway;
    gateway.customer.delete(String(customer.page_id), function(err, result) {
        test.ok(!err);
        customer.remove(function(err) {
            test.ok(!err);
            page.remove(function(err) {
                test.ok(!err);
                test.done();
            });
        });
    });
};