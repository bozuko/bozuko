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
    address                   :[Address]
});

var Subscription = new Schema({
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
    subscriptions             :[Subscription]
}, {safe: {w:2, wtimeout: 5000}});


Customer.pre('save', function(next) {
    var gateway = new BraintreeGateway().gateway;
    var customer = {};
    var self = this;
    ['firstName', 'lastName', 'company', 'email', 'phone', 'website'].forEach(function(key) {
        if (self[key]) customer[key] = self[key];
    });
    gateway.customer.create(customer, function(err, result) {
        if (err) return next(err);
        if (!result.success) return next(result);
        self.bt_id = result.customer.id;
        var date = new Date();
        if (!self.created) self.created = date;
        self.last_modified = date;
        return next();
    });
});

Customer.method('createSubscription', function(opts, callback) {
    var self = this;
    var gateway = new BraintreeGateway().gateway;
    gateway.subscription.create(opts, function(err, result) {
        if (err) return callback(err);
        if (!result.success) return callback(result);
        self.subscriptions.push({planId: result.subscription.planId});
        self.save(function(err) {
            if (err) return callback(err);
            return callback(null, result); 
        });
    });
});
