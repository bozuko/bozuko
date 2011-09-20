var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId,
    inspect = require('util').inspect,
    BraintreeGateway = Bozuko.require('util/braintree')
;

var Customer = module.exports = new Schema({
    page_id                   :{type:ObjectId, index: {unique: true}},
    created                   :{type:Date},
    last_modified             :{type:Date},
    subscriptions             :[String]
}, {safe: {w:2, wtimeout: 5000}});

Customer.static('create', function(opts, callback) 
{
    if (!opts.page_id) {
        return callback(new Error('page_id required for Bozuko.models.Customer.create()'));
    }
    var gateway = new BraintreeGateway().gateway;   
    var data = {};
    ['firstName', 'lastName', 'company', 'email', 'phone', 'website'].forEach(function(key) {
        if (opts[key]) data[key] = opts[key];
    });
    data.id = String(opts.page_id);
    gateway.customer.create(data, function(err, result) {
        var gateway_err = null;
        if (err) return callback(err);
        if (!result.success) return callback(result);

        var customer = new Bozuko.models.Customer({page_id: opts.page_id});
        var date = new Date();
        customer.created = date;
        customer.last_modified = date;
        customer.save(function(err) {
            if (err) {
                console.error('Couldn\'t save customer with page_id = '+
                    customer.page_id+' after braintree creation - '+err);
                // TODO: We probably want some sort of audit mechanism for when we get in this 
                // scenario. Check braintree to see if the customer exists then re-save.
                // Not sure we should even return an error here. Just log it and move on?
                return callback(err);
            }
            return callback(null, customer);
        });
    });        
});

Customer.static('findByGatewayId', function(id, callback) {
    var gateway = new BraintreeGateway().gateway;
    gateway.customer.find(String(id), function(err, result) {
        if (err) return callback(err);
        return callback(null, result);
    });
});

// TODO: We need to ensure the same subscription isn't created twice
Customer.method('createSubscription', function(opts, callback) {
    var self = this;
    var gateway = new BraintreeGateway().gateway;
    gateway.subscription.create(opts, function(err, result) {
        if (err) return callback(err);
        if (!result.success) return callback(result);
        self.subscriptions.push(result.subscription.id);
        self.save(function(err) {
            if (err) {
                console.error('Couldn\'t save customer/subscription with page_id = '+
                    self.page_id+', subscription id = '+result.subscription.id+
                    ' after braintree subscription creation');
                // TODO: We probably want some sort of audit mechanism for when we get in this 
                // scenario. Check braintree to see if the subscription exists then re-save.
                // Not sure we should even return an error here. Just log it and move on?
                return callback(err);
            }
            return callback(null, result); 
        });
    });
});

Customer.method('cancelSubscription', function(id, callback) {
    var gateway = new BraintreeGateway().gateway;
    gateway.subscription.cancel(id, function(err, result) {
        if (err) return callback(err);
        return callback(null, result);
    });
});
