var payflow = require('paynode').use('payflowpro');
var inspect = require('util').inspect;

var PayPalClient = module.exports = function() {
    this.client = payflow.createClient(Bozuko.config.paypal);
};


/* Mandatory Options
 *     subscribername:    String - Full name of the person paying (limit - 32 chars)        
 *     profilestartdate:  DateString
 *     desc:              String - Description of recurring payment (limit - 127 chars, 
 *                                 must match billing agreement description in setExpressCheckout
 *     amt:               String -  (format must contain a period and 2 decimal points and optional 
 *                                  comma not to exceed 10,000.00)
 *     creditcardtype:    String - (Visa, MasterCard, Discover, Amex)
 *     acct:              String - Credit Card number (limit - no spaces or punctuation)
 *     expdate:           String - MMYYYY
 *     cvv2:              String - (3 digits for Visa, MasterCard, Discover. 4 digits for Amex)
 *     email:             String
 *     business:          String - Business Name of buyer (limit - 127 chars)
 *     street:            String - address of business (limit - 100 chars)
 *     city:              String - (limit - 40 chars)
 *     state:             String - (limit - 40 chars)
 *     zip:               String - (limit - 20 chars)
 *     paymentrequest     [{items: [item]}] - item properties nested below
 *        itemcategory:   String - (Digital, Physical)
 *        name:           String - name of item
 *        amt:            String - Amt without taxes/shipping (same format as opts.amt above)
 *        qty:            Number - Any positive integer
 */
PayPalClient.prototype.createRecurringPaymentsProfile = function(opts, callback) {
    opts.autobilloutamt = 'AddToNextBilling';
    opts.billingperiod = 'Month';
    opts.billingfrequency = 1;
    opts.currencycode = 'USD';
    opts.countrycode = 'US';

    this.client.createRecurringPaymentsProfile(opts)
    .on('success', function(result) {
        console.log("createRecurringPaymentsProfile success: "+inspect(result));
        callback(null, result);
    })
   .on('failure', function(result) {
       console.log("createRecurringPaymentsProfile failure: "+inspect(result));
       callback(result);
   });
};
