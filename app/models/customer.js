var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId,
    inspect = require('util').inspect,
    BraintreeGateway = Bozuko.require('util/braintree')
;

var Address = new Schema({
    street                    :{type:String},
    zip                       :{type:String},
    state                     :{type:String},
    company                   :{type:String},
    firstName                 :{type:String},
    lastName                  :{type:String}
});

var CreditCard = new Schema({
    name                      :{type:String},
    type                      :{type:String},
    expDate                   :{type:String},
    last4                     :{type:String},
    token                     :{type:String},
    addresses                 :[Address]
});

var Subscription = new Schema({
    subId               :{type:String},
    planId              :{type:String, index:true},
    addons              :[String],
    discounts           :[String],
    card                :{type:ObjectId}
});

var Customer = module.exports = new Schema({
    user_id                   :{type:ObjectId},
    page_id                   :{type:ObjectId},
    bt_id                     :{type:String},
    firstName                 :{type:String},
    lastName                  :{type:String},
    company                   :{type:String},
    email                     :{type:String},
    phone                     :{type:String},
    website                   :{type:String},
    created                   :{type:Date},
    last_modified             :{type:Date},
    cards                     :[CreditCard],
    addresses                 :[Address],
    subscriptions             :[Subscription]
}, {safe: {w:2, wtimeout: 5000}});

// TODO: We need to ensure that the same customer doesn't exist remotely. Braintree Search API
// not implemented in node yet. Therefore we should send an email if we get an error here. We
// can cleanup manually for now since this will only happen very rarely.
Customer.static('create', function(opts, callback) {
    var gateway = new BraintreeGateway().gateway;
    var customer = new Bozuko.models.Customer(opts);
    var data = {};
    ['firstName', 'lastName', 'company', 'email', 'phone', 'website'].forEach(function(key) {
        if (customer[key]) data[key] = customer[key];
    });
    gateway.customer.create(data, function(err, result) {
        if (err) return callback(err);
        if (!result.success) return callback(result);
        customer.bt_id = result.customer.id;
        var date = new Date();
        customer.created = date;
        customer.last_modified = date;
        customer.save(function(err) {
            // TODO: Return a specific error stating that the customer was created
            // remotely but not locally - Send Alert Email
            if (err) return callback(err);
            return callback(null, customer);
        });
    });
});

// TODO: We need to ensure the same subscription isn't created twice
Customer.method('createSubscription', function(opts, callback) {
    var self = this;
    var gateway = new BraintreeGateway().gateway;
    gateway.subscription.create(opts, function(err, result) {
        if (err) return callback(err);
        if (!result.success) return callback(result);
        self.subscriptions.push({
            planId: result.subscription.planId,
            subId: result.subscription.id
        });
        self.save(function(err) {
            if (err) return callback(err);
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

Customer.static('findByGatewayId', function(id, callback) {
    var gateway = new BraintreeGateway().gateway;
    gateway.customer.find(id, function(err, result) {
        if (err) return callback(err);
        return callback(null, result);
    });
});
