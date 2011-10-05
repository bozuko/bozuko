var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId,
    inspect = require('util').inspect,
    BraintreeGateway = Bozuko.require('util/braintree'),
    async = require('async')
;

var oneday = 24*60*60*1000;
var free_credits = 500;

var Subscription = new Schema({
    active            :{type:Boolean, default: false}
});

var Transaction = new Schema({
    txid              :{type:String},
    credits           :{type:Number},
    timestamp         :{type:Date}
});

var safe = {w:2, wtimeout: 10000};

/*
 *  Can't use model.save() on customers in this module except for in Customer.create()
 *  This is because we can have conflicts/race conditions with the constantly running 
 *  replenishCredits(); Use findAndModify or update instead.
 */
var Customer = module.exports = new Schema({
    type                      :{type:String, 'enum': ['free', 'premium']},
    credits                   :{type:Number, default: 0},
    last_replenish            :{type:Date},
    replenish_day             :{type:Number},
    page_id                   :{type:ObjectId, index: {unique: true}},
    created                   :{type:Date},
    subscriptions             :[Subscription],
    transactions              :[Transaction]
}, {safe: safe});


Customer.static('replenishCredits', function(callback) {
    var now = new Date();
    Bozuko.models.Customer._replenishCredits(now, callback);
});

// Testable internal function. Call replenishCredits in your code, not _replenishCredits
Customer.static('_replenishCredits', function(now, callback) {
    var day = now.getDate();
    // We never replenish after the 28th of the month
    if (day > 28) return callback(null);

    // Only replenish an object if it wasn't replenished today.
    var modification_thresh = new Date(now.getTime() - oneday);

    // Reset free customer credits to free_credits
    Bozuko.models.Customer.update(
        {type: 'free', replenish_day: day, last_replenish: {$lt: modification_thresh}},
        {$set: {credits: free_credits}},
        {multi: true},
        function(err) {
            if (err) return callback(err);
            // Add free_credits to premium customers accounts
            Bozuko.models.Customer.update(
                {type: 'premium', replenish_day: day, last_replenish: {$lt: modification_thresh}},
                {$inc: {credits: free_credits}},
                {multi: true},
                function(err) {
                    if (err) return callback(err);
                    return callback(null);
                }
            );
        }
    );        
});

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
    var day = date.getDate();
    // Only replenish on days 1-28 to keep it simple and allow ignoring months
    if (day > 28) day = 28;
    var customer = new Bozuko.models.Customer({
        type: opts.type,
        page_id: opts.page_id,
        created: date,
        credits: free_credits,
        last_replenish: date,
        replenish_day: day
    });

    // Free customers don't get saved to braintree
    if (customer.type === 'free') {
        return customer.save(function(err) {
            if (err) return callback(err);
            return callback(null, customer);
        });
    }

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

Customer.method('createTransaction', function(gateway, opts, callback) {
    var self = this;
    var timestamp = new Date();
    var transaction = {
        credits: opts.credits, 
        amount: opts.amount,
        timestamp: timestamp
    };

    opts.customFields = {credits: opts.credits};
    delete opts.credits;

    return Bozuko.models.Customer.findAndModify({_id: this._id}, [],
        {$inc: {credits: transaction.credits}, $push: {transactions: transaction}},
        {new: true, fields: {transactions: 1}, safe: safe},
        function(err, customer) {
            if (err) return callback(err);
            var tx_index = customer.transactions.length-1;

            console.log("customer = "+inspect(customer));

            // Make the order id equal to the key of the transaction in mongo
            // Useful for any auditing/error correction
            opts.orderId = customer.transactions[tx_index].id;
            console.log("orderId = "+opts.orderId);
            opts.options = {submitForSettlement: true};

            return gateway.transaction.sale(opts, function(err, result) {
                // TODO: If there is an error here, we should roll back the transaction
                //
                if (err) return callback(err);
                if (!result.success) return callback(result);

                // The transaction has been processed by braintree - record the txid
                return Bozuko.models.Customer.update(
                    {_id: self._id, 'transactions.timestamp': timestamp}, 
                    {$set: {'transactions.$.txid': result.transaction.id}},
                    {}, 
                    function(err) {
                        if (err) {
                            console.log("err = "+err);
                            // really need to think about what to do here. 
                            // The transaction was already submitted. 
                            // send an email and fix manually for now? 
                            // This should pretty much never happen.
                            // Note that a crash could happen before the save also.
                        }
                        return callback(null, result); 
                    }
                );
            });
        }
    );
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
