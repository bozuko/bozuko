var barcode = require('../barcode');
var assert = require('assert');

barcode.create_png('123456789012', 'upc', '/tmp/barcode2', function(err) {
    assert.ok(!err);
});