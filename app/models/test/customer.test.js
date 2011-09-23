var testsuite = require('./config/testsuite');
var BraintreeGateway = Bozuko.require('util/braintree');
var inspect = require('util').inspect;
var async = require('async');

var gateway = new BraintreeGateway().gateway;

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

exports['find customer - fail missing'] = function(test) {
    Bozuko.models.Customer.findByGatewayId(gateway, page._id, function(err, result) {
        test.ok(err);
        test.done();
    });
};

exports['create customer - success'] = function(test) {
    Bozuko.models.Customer.create(gateway, {
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
    Bozuko.models.Customer.create(gateway, {
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

exports['create same customer - success after removal from braintree'] = function(test) {
    gateway.customer.delete(String(page._id), function(err) {
        test.ok(!err);
        Bozuko.models.Customer.findByGatewayId(gateway, page._id, function(err, result) {
            test.ok(err);
            exports['create customer - success'](test);
        });
    });
};

exports['find customer'] = function(test) {
    Bozuko.models.Customer.findByGatewayId(gateway, page._id, function(err, result) {
        test.ok(!err);
        test.done();
    });
};

// DO NOT EVER do this on a production system. This is only for tests. 
// We must use Transparent Redirect (TR) to remain PCI compliant.
exports['create credit card'] = function(test) {
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
    Bozuko.models.Customer.findByGatewayId(gateway, customer.page_id, function(err, result) {
        test.ok(!err);
        test.deepEqual(cc_token, result.creditCards[0].token);
        test.done();
    });
};

exports['create active subscription - success'] = function(test) {
    customer.createActiveSubscription(gateway, {
        paymentMethodToken: cc_token,
        planId: 'monthly_subscription'
    }, function(err, result) {
        test.ok(!err);
        test.done();
    });
};

exports['create another active subscription - fail'] = function(test) {
    customer.createActiveSubscription(gateway, {
        paymentMethodToken: cc_token,
        planId: 'monthly_subscription'
    }, function(err, result) {
        test.ok(err);
        test.done();
    });
};

exports['cancel active subscription'] = function(test) {
    customer.cancelActiveSubscription(gateway, function(err, result) {
        test.ok(!err);
        test.done();
    });
};

// We always allow cancelling subscriptions. Only if there is a service error will an error be returned.
exports['cancel active subscription again - success'] = function(test) {
    customer.cancelActiveSubscription(gateway, function(err) {
        test.ok(!err);
        test.done();
    });
};


exports['create another active subscription with sub on mongo but not braintree - success'] = function(test) {
    customer.subscriptions.push({active:true});
    customer.save(function(err) {
        test.ok(!err);
        customer.createActiveSubscription(gateway, {
            paymentMethodToken: cc_token,
            planId: 'monthly_subscription'
        }, function(err, result) {
            test.ok(!err);
            test.done();
        });
    });
};

exports['update active subscription - success'] = function(test) {
    var opts = {
        price: '125.00',
        options: {
            prorateCharges: true
        }
    };
    customer.updateActiveSubscription(gateway, opts, function(err, result) {
        test.ok(!err);
        test.deepEqual(result.subscription.price, '125.00');
        test.done();
    });
};

exports['cancel subscription with active sub in braintree but no active sub in mongo - success'] = function(test) {
    customer.subscriptions[customer.subscriptions.length-1].active = false;
    customer.cancelActiveSubscription(gateway, function(err) {
        test.ok(!err);
        test.done();
    });
};

exports['cancel the last subscription added - success'] = function(test) {
    customer.cancelActiveSubscription(gateway, function(err) {
        test.ok(!err);
        test.done();
    });
};

exports['verify all subscriptions are cancelled'] = function(test) {
    test.equal(customer.subscriptions.length, 2);
    async.forEach(customer.subscriptions, function(sub, cb) {
        test.ok(!sub.active);
        gateway.subscription.find(String(sub._id), function(err, result) {
            test.ok(!err);
            test.equal(result.status, 'Canceled');
            cb(null);
        });
    }, function(err) {
        test.done();
    });
};

exports['update active subscription - fail'] = function(test) {
    var opts = {price: '150.00'};
    customer.updateActiveSubscription(gateway, opts, function(err, result) {
        test.ok(err);
        test.done();
    });    
};

var addressId = null;
exports['create address - success'] = function(test) {
    var opts = {
         firstName: 'Jenna',
         lastName: 'Smith',
         company: 'Braintree',
         streetAddress: '1 E Main St',
         extendedAddress: 'Suite 403',
         locality: 'Chicago',
         region: 'Illinois',
         postalCode: '60607',
         countryCodeAlpha2: 'US'
    };
    customer.createAddress(gateway, opts, function(err, result) {
        test.ok(!err);
        addressId = result.address.id;
        test.done();
    });
};

exports['update address - success'] = function(test) {
    customer.updateAddress(gateway, addressId, {firstName: 'Dave'}, function(err, result) {
        test.ok(!err);
        test.deepEqual('Dave', result.address.firstName);
        test.done();
    });
};

exports['delete address - success'] = function(test) {
    customer.deleteAddress(gateway, addressId, function(err) {
        test.ok(!err);
        test.done();
    });
};

exports['update address - fail'] = function(test) {
    customer.updateAddress(gateway, addressId, {firstName: 'Sarah'}, function(err, result) {
        test.ok(err);
        test.done();
    });
};

// Not sure we actually ever want to remove customers. We may just want to cancel subscriptions.
// So just do it from the test for cleanup.
exports['remove customer'] = function(test) {
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

exports['verify customer doesn\'t exist'] = function(test) {
    Bozuko.models.Customer.findByGatewayId(gateway, customer._id, function(err, result) {
        test.ok(err);
        test.equal(err.type, 'notFoundError');
        test.ok(!result);
        test.done();
    });
};
