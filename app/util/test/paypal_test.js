var Client = require('../paypal');
process.env.NODE_ENV='test';
require('../../../app/bozuko');

var c = new Client();

module.exports['createRecurringPaymentsProfile'] = function(test) {
    c.createRecurringPaymentsProfile({
        subscribername: 'Andrew Stone',
        profilestartdate: new Date().toISOString(),
        desc: 'monthly subscription',
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