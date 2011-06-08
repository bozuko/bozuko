var barcode = require('../barcode'),
    fs = require('fs'),
    path = require('path'),
    assert = require('assert');

// setup the tmp folder
var filename = __dirname+'/barcode_test';

barcode.create_png('123456789012', 'upc', filename, function(err) {
    assert.ok(!err);
    
    /**
     * Cleanup
     */
    ['.ps','.png'].forEach(function(ext){
        if( path.existsSync(filename+ext) ) fs.unlinkSync( filename+ext);
    });
    
});