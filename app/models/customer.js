var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId,
    inspect = require('util').inspect,
    BraintreeGateway = Bozuko.require('util/braintree')
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
        if (customer) saved.mongo = customer;
        gateway.customer.find(String(page_id), function(err, result) {
            if (!err) saved.braintree = result;
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
    
    // Ensure this customer doesn't already have an active subscription
    if (!this.subscriptions.every(function(sub) {
        return !sub.active;
    })) return callback(Bozuko.error('customer/active_subscription_exists'));

    this.subscriptions.push({active: true});
    this.save(function(err) {
        if (err) return callback(err);
        var gateway = new BraintreeGateway().gateway;
        opts.id = String(self.subscriptions[self.subscriptions.length - 1]._id);
        gateway.subscription.create(opts, function(err, result) {
            // TODO: If there is an error we will need to recreate the subscription on braintree
            // at a later time.
            if (err) return callback(err);
            if (!result.success) return callback(result);
            return callback(null, result); 
        });
    });
});

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
    if (!active_sub) return callback(Bozuko.error('customer/no_active_subscriptions'));
                    
    active_sub.active = false;
    this.save(function(err) {
        if (err) return callback(err);
        gateway.subscription.cancel(active_sub._id, function(err, result) {
            if (err) return callback(err);
            return callback(null, result);
        });
    });
});
