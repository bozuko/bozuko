var Client = require('../paypal');
var inspect = require('util').inspect;
process.env.NODE_ENV='test';
require('../../../app/bozuko');

var c = new Client();

module.exports['createRecurringPaymentsProfile'] = function(test) {
    c.createRecurringPaymentsProfile({
        subscribername: 'Andrew Stone',
        firstname: 'Andrew',
        lastname: 'Stone',
        profilestartdate: new Date().toISOString(),
        desc: 'monthly of digital sweets',
        amt: '100.00',
        creditcardtype: 'Visa',
        acct: '4096079492189361',
        expdate: '092016',
        email: 'andrew.j.stone.1@gmail.com',
        business: 'andrews sweets',
        street: '123 missing lane',
        state: 'ct',
        city: 'orange',
        zip: '06477',
        paymentrequest: [{items: [{itemcategory: 'Digital', name: 'digital candy', amt: '100.00', qty: 1}]}]
    }, function(err, result) {
        test.ok(!err);
        test.ok(result.profileid);
        test.ok(result.profilestatus);
        test.ok(result.timestamp);
        test.deepEqual(result.ack, 'Success');
        test.done();
    });
};

module.exports['getRecurringPaymentsProfileDetails'] = function(test) {
    c.getRecurringPaymentsProfileDetails(function(err, result) {
        test.ok(!err);
        test.done();
    });
};

module.exports['doReferenceTransaction'] = function(test) {
    c.doReferenceTransaction({
        amt: '100.00',
        expdate: '092016',
        firstname: 'Andrew',
        lastname: 'Stone',
        paymentaction: 'Sale',
        paymentrequest: [{items: [{itemcategory: 'Digital', name: 'digital ice cream', amt: '100.00', qty: 1}]}]
    }, function(err, result) {
        if (err) console.log(inspect(err));
        if (result) console.log(inspect(result));
        test.ok(!err);
        test.done();
    });
                             
};

module.exports['manageRecurringPaymentsProfileStatus - Cancel'] = function(test) {
    c.manageRecurringPaymentsProfileStatus({action: 'Cancel', note: 'Test Cancel'}, 
        function(err, result) {
            test.ok(!err);
            test.done();
        }
    );
};