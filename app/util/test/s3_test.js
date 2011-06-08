var S3 = require('../s3');
var assert = require('assert');

process.env.NODE_ENV='test';

var bozuko = require('../../../app/bozuko');
bozuko.getApp();

var s3 = new S3();

s3.put(Bozuko.dir+'/app/static/images/barcode.png', '/game/1/prize/1/barcode/1', function(err) {
    assert.ok(!err);
    console.log("put barcode succeeded");
});