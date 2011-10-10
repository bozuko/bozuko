var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId,
    Oid = mongoose.Types.ObjectId,
    inspect = require('util').inspect,
    BraintreeGateway = Bozuko.require('util/braintree'),
    async = require('async'),
    mail = Bozuko.require('util/mail')
;

var oneday = 24*60*60*1000;
var free_credits = 500;

var Subscription = new Schema({
    _id               :{type:ObjectId},
    active            :{type:Boolean, default: false}
});

var Transaction = new Schema({
    _id               :{type:ObjectId},
    txid              :{type:String, index: true},
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
    last_replenish            :{type:Date, index: true},
    replenish_day             :{type:Number, index: true},
    page_id                   :{type:ObjectId, index: {unique: true}},
    created                   :{type:Date},
    subscriptions             :[Subscription],
    transactions              :[Transaction]
}, {safe: safe});


/*
 * @idempotent
 */
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

    Bozuko.models.Customer.update(
        {type: 'premium', replenish_day: day, last_replenish: {$lt: modification_thresh}},
        {$inc: {credits: free_credits}},
        {multi: true},
        function(err) {
            if (err) return callback(err);
            return callback(null);
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

/*
 * @idempotent
 */
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

Customer.method('spendCredits', function(credits, callback) {
    Bozuko.models.Customer.findAndModify(
        {_id: this._id, credits: {$gte: credits}}, [],
        {$inc: {credits: -1*credits}},
        {new: true, safe: safe},
        function(err, customer) {
            if (err) return callback(err);
            return callback(null, customer);
        });
});

Customer.static('audit', function(callback) {
    var customers = {
        missing_txids: []
    };
    // Find all customers with transactions that are missing txid's
    Bozuko.models.Customer.find(
        {'transactions.txid': {$exists: false}, 'transactions._id': {$exists: true}}, 
        {_id: 1}, 
        function(err, missing_txids) {
            if (err) return callback(err);
            missing_txids.forEach(function(customer) {
                customers.missing_txids.push(customer._id);
            });
            return callback(null, customers);        
        }
    );
});

Customer.method('createTransaction', function(gateway, opts, callback) {
    var self = this;
    if (this.type === 'free') return callback(Bozuko.error('customer/free'));
    var timestamp = new Date();

    // Need to generate our own _id for the embedded transaction as findAndModify doesn't seem
    // to create them for embedded docs and the driver returns different ones on update.
    var transaction = {
        _id: new Oid(),
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

            // Make the order id equal to the key of the transaction in mongo
            // Useful for any auditing/error correction
            opts.orderId = String(customer.transactions[tx_index]._id);
            opts.options = {submitForSettlement: true};

            return gateway.transaction.sale(opts, function(err, result) {
                var error = err ? err : !result.success ? result : null;
                if (error) {
                    // Rollback the last credit increase because the sale failed
                    return Bozuko.models.Customer.findAndModify({_id: self._id}, [],
                        {$inc: {credits: -1*transaction.credits}, $pop : {transactions: 1}},
                        {safe: safe}, function(err) {
                            if (err) {
                                // ***ALERT POINT*** - This is uncrecoverable without intervention
                                var msg = 'Failed to rollback transaction for customer '+self._id+
                                    ", mongo transaction id = "+opts.orderId+', error = '+err;
                                console.error(msg);
                                sendEmail(msg);
                            }
                            return callback(error);
                        }
                    );
                }

                // The transaction has been processed by braintree - record the txid
                var modifier = {};
                modifier['transactions.'+tx_index+'.txid'] = result.transaction.id;
                return Bozuko.models.Customer.update(
                    {_id: self._id},
                    {$set: modifier},
                    {}, 
                    function(err) {
                        if (err) {
                            //***ALERT POINT*** - This is uncrecoverable without intervention
                            var msg = "Failed to save txid for successful transaction: "+
                            "customer._id = "+self._id+", mongo transaction id = "+opts.orderId+
                            ", bt transaction id = "+result.transaction.id+", err = "+err;
                            console.error(msg);
                            sendEmail(msg);
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

Customer.method('getActiveSubscription', function(callback) {
    Bozuko.models.Customer.findOne({_id: this._id}, function(err, customer) {
        if (err) return callback(err);
        for (var i = 0; i < customer.subscriptions.length; i++) {
            if (customer.subscriptions[i].active) {
                return callback(null, customer.subscriptions[i], customer);
            }
        }
        return callback(null, null, customer);
    });
});

Customer.method('updateActiveSubscription', function(gateway, opts, callback) {
    this.getActiveSubscription(function(err, active_sub) {
        if (err) return callback(err);
        if (!active_sub) return callback(Bozuko.error('customer/no_active_subscriptions'));
        var id = String(active_sub._id);
        gateway.subscription.update(id, opts, function(err, result) {
            if (err) return callback(err);
            if (!result.success) return callback(result);
            callback(null, result);
        });
    });
});

Customer.method('rollbackActiveSubscription', function(err, id, callback) {
    var self = this;
    return Bozuko.models.Customer.collection.update(
        {_id: this._id},
        {$pull: {subscriptions : {_id: id}}, $set: {type: 'free'}},
        {safe: safe}, function(error) {
            if (error) {
                // ***ALERT POINT*** - This isn't really an issue, since createActiveSubscription 
                // will just reuse the one in mongo
                var msg = 'failed to rollback subscription for customer '+self._id+", subscription id = "+id;
                console.error(msg);
                sendEmail(msg);
            }
            return callback(err);
        }
    );
});


// Creating a subscription changes a 'free' customer to a 'premium' customer
Customer.method('createActiveSubscription', function(gateway, opts, callback) {
    var self = this;

    this.getActiveSubscription(function(err, active_sub) {
        if (active_sub) {
            return gateway.subscription.find(String(active_sub._id), function(err, result) {
                if (err && err.type !== 'notFoundError') return callback(err);
                if (result) return callback(Bozuko.error('customer/subscription_exists'));
                // There is an active subscription in mongo, but not on braintree. Create it.
                opts.id = String(active_sub._id);
                gateway.subscription.create(opts, function(err, result) {
                    var error = err ? err : !result.success ? result : null;
                    if (error) return self.rollbackActiveSubscription(error, active_sub._id,callback);
                    return callback(null, result); 
                });
            });        
        }

        var sub = {_id: new Oid(), active: true};
        return Bozuko.models.Customer.update({_id: self._id},
            {$push: {subscriptions: sub}, $set: {type: 'premium'}}, {}, function(err) {
                if (err) return callback(err); 
                opts.id = String(sub._id);
                gateway.subscription.create(opts, function(err, result) {
                    var error = err ? err : !result.success ? result : null;
                    if (error) return self.rollbackActiveSubscription(error, sub._id, callback);
                    return callback(null, result); 
                });
            }
        );
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

// TODO: Subtract credits? 
Customer.method('cancelActiveSubscription', function(gateway, callback) {
    var self = this;
    this.getActiveSubscription(function(err, active_sub, customer) {
        if (err) return callback(err);
        var subscriptions = customer.subscriptions;
        if (!active_sub) return cancelGatewaySubscriptions(gateway, subscriptions, callback);
        Bozuko.models.Customer.collection.update(
            {_id: self._id, 'subscriptions.active': true}, 
            {$set: {'subscriptions.$.active': false, type: 'free'}},
            {safe: safe}, function(err) {
                if (err) return callback(err);
                cancelGatewaySubscription(gateway, String(active_sub._id), callback);
            }
        );
    });
});

function sendEmail(msg) {
    return mail.send({
        to: 'dev@bozuko.com',
        subject: 'ALERT: Customer Payment',
        body: msg
    }, function(err, success) {
        if (err) console.error("Email Err = "+err);
        if (err || !success) {
            console.error("Error sending customer payment alert email");
        }
    });
}
