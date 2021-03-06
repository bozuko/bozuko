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
}, {safe: {j:true}});


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

Customer.static('create', function(gateway, opts, callback) {
    if (!opts.page_id) {
        return callback(Bozuko.error('customer/no_page_id'));
    }
    var date = new Date();
    var customer = new Bozuko.models.Customer({
        page_id: opts.page_id,
        created: date,
        last_modified: date
    });

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

Customer.method('createAddress', function(gateway, opts, callback) {
    opts.customerId = String(this.page_id);
    gateway.address.create(opts, function(err, result) {
        if (err) return callback(err);
        if (!result.success) return callback(result);
        return callback(null, result);
    });
});

Customer.method('updateAddress', function(gateway, addressId, opts, callback) {
    gateway.address.update(String(this.page_id), addressId, opts, function(err, result) {
        if (err) return callback(err);
        if (!result.success) return callback(result);
        return callback(null, result);
    });
});

Customer.method('deleteAddress', function(gateway, addressId, callback) {
    gateway.address.delete(String(this.page_id), addressId, callback);
});

Customer.static('findByGatewayId', function(gateway, id, callback) {
    gateway.customer.find(String(id), callback);
});

Customer.method('getActiveSubscription', function() {
    for (var i = 0; i < this.subscriptions.length; i++) {
        if (this.subscriptions[i].active) {
            return this.subscriptions[i];
        }
    }
    return null;
});

Customer.method('updateActiveSubscription', function(gateway, opts, callback) {
    var active_sub = this.getActiveSubscription();
    if (!active_sub) return callback(Bozuko.error('customer/no_active_subscriptions'));
    var id = String(active_sub._id);
    gateway.subscription.update(id, opts, function(err, result) {
        if (err) return callback(err);
        if (!result.success) return callback(result);
        callback(null, result);
    });
});

Customer.method('createActiveSubscription', function(gateway, opts, callback) {
    var self = this;
    var active_sub = this.getActiveSubscription();
   
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

Customer.method('cancelActiveSubscription', function(gateway, callback) {
    var active_sub = this.getActiveSubscription();
    var subscriptions = this.subscriptions;

    if (!active_sub) return cancelGatewaySubscriptions(gateway, subscriptions, callback);
                    
    active_sub.active = false;
    this.save(function(err) {
        if (err) return callback(err);
        cancelGatewaySubscription(gateway, String(active_sub._id), callback);
    });
});
