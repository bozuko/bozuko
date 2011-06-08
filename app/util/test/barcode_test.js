var barcode = require('../barcode'),
    fs = require('fs'),
    path = require('path'),
    assert = require('assert');

// setup the tmp folder
var filename = __dirname+'/barcode_test';
module.exports['Test Barcode Creation'] = function(test){
    barcode.create_png('123456789012', 'upc', filename, function(err) {
        
        test.ok(!err);
        test.done();
        
        /**
         * Cleanup
         */
        ['.ps','.png'].forEach(function(ext){
            if( path.existsSync(filename+ext) ){
                fs.unlinkSync( filename+ext);
            }
        });
        
    });
}