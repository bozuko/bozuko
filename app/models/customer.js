var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId,
    inspect = require('util').inspect,
    BraintreeGateway = Bozuko.require('util/braintree'),
    async = require('async')
;

var Subscription = new Schema({
    active                    :{type:Boolean, default: false}
});

var Customer = module.exports = new Schema({
    page_id                   :{type:ObjectId, index: {unique: true}},
    created                   :{type:Date},
    last_modified             :{type:Date},
    subscriptions             :[Subscription]
}, {safe: {w:2, wtimeout: 5000}});


function getCustomerStatus(gateway, page_id, callback) {
    var saved = {};
    Bozuko.models.Customer.findOne({page_id: page_id}, function(err, customer) {
        if (err) return callback(err);
        if (customer) saved.mongo = customer;
        gateway.customer.find(String(page_id), function(err, result) {
            if (err && err.type !== 'notFoundError') return callback(err);
            saved.braintree = result;
            return callback(null, saved);
        });        
    });
}; 

function createGatewayCustomer(gateway, opts, customer, callback) {
    var data = {};
    ['firstName', 'lastName', 'company', 'email', 'phone', 'website'].forEach(function(key) {
        if (opts[key]) data[key] = opts[key];
    });
    data.id = String(opts.page_id);
    gateway.customer.create(data, function(err, result) {
        if (err) return callback(err);
        if (!result.success) return callback(result);
        return callback(null, customer);                         
    });
}

Customer.static('create', function(opts, callback) {
    if (!opts.page_id) {
        return callback(Bozuko.error('customer/no_page_id'));
    }
    var date = new Date();
    var customer = new Bozuko.models.Customer({
        page_id: opts.page_id,
        created: date,
        last_modified: date
    });
    var gateway = new BraintreeGateway().gateway;

    return getCustomerStatus(gateway, opts.page_id, function(err, saved) {
        if (err) return callback(err);
        if (saved.mongo && saved.braintree) return callback(Bozuko.error('customer/already_exists'));
        if (!saved.mongo) return customer.save(function(err) {
            if (err) return callback(err);
            if (saved.braintree) return callback(Bozuko.error('customer/already_exists'));
            return createGatewayCustomer(gateway, opts, customer, callback);
        });
        if (saved.mongo && !saved.braintree) return createGatewayCustomer(gateway, opts, saved.mongo, callback);
    });
});

Customer.static('findByGatewayId', function(id, callback) {
    var gateway = new BraintreeGateway().gateway;
    gateway.customer.find(String(id), callback);
});

Customer.method('createActiveSubscription', function(opts, callback) {
    var self = this;
    var gateway = new BraintreeGateway().gateway;    
    var active_sub = null;

    // Ensure this customer doesn't already have an active subscription
    for (var i = 0; i < this.subscriptions.length; i++) {
        if (this.subscriptions[i].active) {
            active_sub = this.subscriptions[i];
            break;
        }
    }

    if (active_sub) {
        return gateway.subscription.find(String(active_sub._id), function(err, result) {
            if (err && err.type !== 'notFoundError') return callback(err);
            if (result) return callback(Bozuko.error('customer/subscription_exists'));
            // There is an active subscription in mongo, but not on braintree. Create it.
            opts.id = String(active_sub._id);
            gateway.subscription.create(opts, function(err, result) {
                if (err) return callback(err);
                if (!result.success) return callback(result);
                return callback(null, result); 
            });
        });        
    }

    this.subscriptions.push({active: true});
    this.save(function(err) {
        if (err) return callback(err); 
        opts.id = String(self.subscriptions[self.subscriptions.length - 1]._id);
        gateway.subscription.create(opts, function(err, result) {
            if (err) return callback(err);
            if (!result.success) return callback(result);
            return callback(null, result); 
        });
    });
});

function cancelGatewaySubscription(gateway, id, callback) {
    gateway.subscription.cancel(id, function(err, result) {
        if (err) return callback(err);
        // Don't return an error when cancelling an already cancelled subscription
        if (!result.success && !result.errors.for('subscription').validationErrors) {
            return callback(result);
        }
        return callback(null);
    });
};

/*
 * Call this when there are no active subscriptions in mongo. Just attempt to cancel every subscription
 * for this customer to ensure we don't keep billing them in case of a previous error. Gotta keep it idempotent :)
 */
function cancelGatewaySubscriptions(gateway, subscriptions, callback) {
    async.forEach(subscriptions, function(sub, cb) {
        return cancelGatewaySubscription(gateway, String(sub._id), cb);
    }, function(err) {
        if (err) return callback(err);
        return callback(null);
    });
};

Customer.method('cancelActiveSubscription', function(callback) {
    var gateway = new BraintreeGateway().gateway;
    var active_sub = null;
    var subscriptions = this.subscriptions;
    for (var i = 0; i < subscriptions.length; i++) {
        if (subscriptions[i].active) {
            active_sub = subscriptions[i];
            break;
        }
    }
    if (!active_sub) return cancelGatewaySubscriptions(gateway, subscriptions, callback);
                    
    active_sub.active = false;
    this.save(function(err) {
        if (err) return callback(err);
        cancelGatewaySubscription(gateway, String(active_sub._id), callback);
    });
});
