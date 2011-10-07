var testsuite = require('./config/testsuite');
var BraintreeGateway = Bozuko.require('util/braintree');
var inspect = require('util').inspect;
var async = require('async');
ObjectId = require('mongoose').Types.ObjectId;

var gateway = new BraintreeGateway().gateway;

var customer,
    free_customer,
    cc_token,
    page,
    free_page,
    oneday = 24*60*60*1000
;

exports['remove all pages and customers'] = function(test) {
    Bozuko.models.Page.remove({}, function(err) {
        test.ok(!err);
        Bozuko.models.Customer.remove({}, function(err) {
            test.ok(!err);
            test.done();
        });
    });
};

exports['create page'] = function(test) {
    page = new Bozuko.models.Page();
    page.active = true;
    page.name = "Murray's Page";
    page.save(function(err) {
        test.ok(!err);
        test.done();
    });
};

exports['create free user page'] = function(test) {
    free_page = new Bozuko.models.Page({
        active: true,
        name: 'some free page'
    });
    free_page.save(function(err) {
        test.ok(!err);
        test.done();
    });
};

/*
 * CUSTOMER TESTS
 */

exports['find customer - fail missing'] = function(test) {
    Bozuko.models.Customer.findByGatewayId(gateway, page._id, function(err, result) {
        test.ok(err);
        test.done();
    });
};

exports['create customer - success'] = function(test) {
    Bozuko.models.Customer.create(gateway, {
        type: 'premium',
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
        type: 'premium',
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

exports['find customer - success'] = function(test) {
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
        number: "4111111111111111",
        expirationDate: "05/2014",
        cardholderName: 'Murray N. Rothbard',
        cvv: '123'
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

/*
 * FREE CUSTOMER TESTS
 */

exports['create free customer - success'] = function(test) {
    Bozuko.models.Customer.create(gateway, {
        type: 'free',
        page_id: free_page.id,
        firstName: 'Fred',
        lastName: 'Bastiat'
    }, function(err, newCustomer) {
        test.ok(!err);
        test.ok(newCustomer);
        free_customer = newCustomer;
        test.done();
    });
};

exports['ensure free customer is not on braintree'] = function(test) {
    gateway.customer.find(free_page.id, function(err, result) {
        test.ok(err);
        test.equal(err.type, 'notFoundError');
        test.done();
    });
};

/*
 * REPLENISH CREDITS TESTS
 */
exports['replenish customers that were just created - no change'] = function(test) {
    // Both the free and premium customers should have 500 credits as no transactions have
    // occurred yet.
    Bozuko.models.Customer.count({credits: 500}, function(err, count) {
        test.ok(!err);
        test.equal(count, 2);

        Bozuko.models.Customer._replenishCredits(new Date(), function(err) {
            test.ok(!err);
            
            // There should be no change in credits since the customer was created within the last 
            // 24 hrs.
            Bozuko.models.Customer.count({credits: 500}, function(err, count) {
                test.ok(!err);
                test.equal(count, 2);
                test.done();
            });
        });
    });
};

exports['replenish customers on next day - no change'] = function(test) {
    var now = new Date();
    var tomorrow = new Date(now.getTime() + oneday);
    Bozuko.models.Customer._replenishCredits(tomorrow, function(err) {
        test.ok(!err);
        
        Bozuko.models.Customer.count({credits: 500}, function(err, count) {
            test.ok(!err);
            test.equal(count, 2);
            test.done();
        });
    });
};

function next_month() {
    var date = new Date();
    var year = date.getYear();
    var month = date.getMonth();
    var day = date.getDate();

    if (month === 11) {
        month = 0;
        year++;
    } else {
        month++;
    }

    return new Date(year, month, day);
}

exports['replenish customers next month - success'] = function(test) {
    Bozuko.models.Customer._replenishCredits(next_month(), function(err) {
        test.ok(!err);
        
        // The free customer can never go over 500 credits
        Bozuko.models.Customer.count({credits: 500}, function(err, count) {
            test.ok(!err);
            test.equal(count, 1);

            Bozuko.models.Customer.count({credits: 1000}, function(err, count) {
                test.ok(!err);
                test.equal(count, 1);
                test.done();
            });
        });
    });
};


/*
 * TRANSACTION TESTS
 */

exports['create transaction - success'] = function(test) {
    customer.createTransaction(gateway, {
        amount: '49.99',
        customerId: String(customer.page_id),
        credits: 1000,
        paymentMethodToken: cc_token
    }, function(err, result) {
        test.ok(!err);
        test.ok(result.transaction.id);
        test.equal(result.transaction.customFields.credits, '1000');
        test.equal(result.transaction.amount, '49.99');
        test.equal(result.transaction.customer.id, customer.page_id);
        test.equal(result.transaction.status, 'submitted_for_settlement');

        Bozuko.models.Customer.findOne({_id: customer._id}, function(err, cust) {
            var transaction = cust.transactions[cust.transactions.length-1];
            test.equal(cust.transactions.length, 1);
            test.equal(result.transaction.orderId, transaction.id);
            test.equal(result.transaction.id, transaction.txid);
            test.equal(cust.credits, 2000);
            test.done();
        });
    });
};

exports['create second transaction - success'] = function(test) {
    customer.createTransaction(gateway, {
        amount: '149.99',
        customerId: String(customer.page_id),
        credits: 5000,
        paymentMethodToken: cc_token
    }, function(err, result) {
        test.ok(!err);
        test.ok(result.transaction.id);
        test.equal(result.transaction.customFields.credits, '5000');
        test.equal(result.transaction.amount, '149.99');
        test.equal(result.transaction.customer.id, customer.page_id);
        test.equal(result.transaction.status, 'submitted_for_settlement');

        Bozuko.models.Customer.findOne({_id: customer._id}, function(err, cust) {
            var transaction = cust.transactions[cust.transactions.length-1];
            test.equal(cust.transactions.length, 2);
            test.equal(result.transaction.orderId, transaction.id);
            test.equal(result.transaction.id, transaction.txid);
            test.equal(cust.credits, 7000);
            test.done();
        });
    });    
};

exports['create transaction for free customer - fail'] = function(test) {
    free_customer.createTransaction(gateway, {
        amount: '149.99',
        customerId: String(free_customer.page_id),
        credits: 5000
    }, function(err, result) {
        test.ok(err);
        test.equal(err.name, 'customer/free');
        test.done();
    });
};

exports['create transaction that fails validation - ensure rollback works'] = function(test) {
    customer.createTransaction(gateway, {
        amount: '2000.01',
        customerId: String(customer.page_id),
        credits: 5000
    }, function(err, result) {
        test.ok(err);

        Bozuko.models.Customer.findOne({_id: customer._id}, function(err, cust) {
            test.equal(cust.transactions.length, 2);
            test.equal(cust.credits, 7000);

            // Reset customer to what's in mongo for later tests
            customer = cust;
            test.done();
        });
    });
};

exports['spend credits - success'] = function(test) {
    customer.spendCredits(5000, function(err, updatedCust) {
        test.ok(!err);
        test.equal(updatedCust.credits, 2000);
        customer = updatedCust;
        test.done();
    });
};

exports['spend credits - fail'] = function(test) {
    customer.spendCredits(2001, function(err, updatedCust) {
        test.ok(err);
        test.ok(!updatedCust);
        test.done();
    });
};

/*
 * SUBSCRIPTION TESTS
 */


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
        
        // Ensure there is only one currently active subscription
        Bozuko.models.Customer.findOne({_id: customer._id}, function(err, cust) {
            var active_ct = 0;
            for (var i = 0; i < cust.subscriptions.length; i++) {
                if (cust.subscriptions[i].active) active_ct++;
            }
            test.equal(active_ct, 1);
            test.done();
        });
    });
};

exports['cancel active subscription - success'] = function(test) {
    customer.cancelActiveSubscription(gateway, function(err) {
        test.ok(!err);
        Bozuko.models.Customer.findOne({_id: customer._id}, function(err, cust) {
            var active_ct = 0;
            for (var i = 0; i < cust.subscriptions.length; i++) {
                if (cust.subscriptions[i].active) active_ct++;
            }
            test.equal(active_ct, 0);

            // When a subscription is cancelled, the customer is no longer a premium customer
            test.equal(cust.type, 'free');

            // use latest db info for customer
            customer = cust;
            test.done();
        });
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
    customer.subscriptions.push({_id: new ObjectId(), active:true});
    customer.type = 'premium'; // This is what normally happens during a createActiveSubscription call
    customer.save(function(err) {
        test.ok(!err);
        customer.createActiveSubscription(gateway, {
            paymentMethodToken: cc_token,
            planId: 'monthly_subscription'
        }, function(err, result) {
            test.ok(!err);
            Bozuko.models.Customer.count({_id: customer._id, 'subscriptions.active': true, type: 'premium'}, 
                function(err, count) {
                    test.equal(count, 1);
                    test.done();
                }
            );
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
    Bozuko.models.Customer.findOne({_id: customer._id}, function(err, cust) {
        test.ok(!err);
        test.ok(cust);
        var active_ct = 0;
        for (var i = 0; i < cust.subscriptions.length; i++) {
            if (cust.subscriptions[i].active) active_ct++;
        }
        test.equal(active_ct, 1);
        customer = cust;
        customer.subscriptions[customer.subscriptions.length-1].active = false;
        customer.type = 'free';
        customer.save(function(err) {
            test.ok(!err);
            customer.cancelActiveSubscription(gateway, function(err) {
                test.ok(!err);
                test.done();
            });
        });
    });
};

exports['cancel the last subscription added - success'] = function(test) {
    customer.cancelActiveSubscription(gateway, function(err) {
        test.ok(!err);
        Bozuko.models.Customer.findOne({_id: customer._id}, function(err, cust) {
            test.ok(!err);
            test.equal(cust.type, 'free');
            test.done();
        });
    });
};

exports['create new subscription to bill immediately - success'] = function(test) {
    customer.createActiveSubscription(gateway, {
        paymentMethodToken: cc_token,
        planId: 'bill_immediately'
    }, function(err, result) {
        test.ok(!err);
        Bozuko.models.Customer.findOne({_id: customer._id}, function(err, cust) {
            test.ok(!err);
            test.equal(cust.type, 'premium');
            test.done();
        });
    });
};

exports['cancel the last subscription 2 - success'] = function(test) {
    customer.cancelActiveSubscription(gateway, function(err) {
        test.ok(!err);
        test.done();
    });
};

// DON'T DO THIS IN PRODUCTION: NOT PCI COMPLIANT - Just testing bad number
exports['update credit card to use an invalid number - fail'] = function(test) {
    gateway.creditCard.update(cc_token, {
        number: "4000111111111115"
    }, function(err, result) {
        test.ok(!result.success);
        test.done();
    });
};

// Use a price in the range  $2000.00 - $2047.99 to get a processer error
exports['create new subscription to bill immediately - fail validation'] = function(test) {
    customer.createActiveSubscription(gateway, {
        paymentMethodToken: cc_token,
        planId: 'bill_immediately',
        price: '2000.01'
    }, function(err, result) {
        test.ok(err);
        test.done();
    });
}; 

exports['verify all subscriptions are cancelled'] = function(test) {
    Bozuko.models.Customer.findOne({_id: customer._id}, function(err, cust) {
        customer = cust;
        test.equal(customer.subscriptions.length, 3);
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
    });
};

exports['update active subscription - fail'] = function(test) {
    var opts = {price: '150.00'};
    customer.updateActiveSubscription(gateway, opts, function(err, result) {
        test.ok(err);
        test.done();
    });    
};

/*
 * ADDRESS TESTS
 */

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

