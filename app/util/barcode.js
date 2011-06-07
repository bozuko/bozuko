var exec = require('child_process').exec;

exports.create_png = function(barcode, encoding, filename, callback) {
    exec('barcode -b '+barcode+' -e '+encoding+' -o '+filename+'.ps'+' -u pt'+' -g 100x40'+' -p 100x40', function(err, stdout, stderr) {
        if (err) {
            console.error(err);
            console.error(stderr);
            return callback(err);
        }

        exec('convert -density 100 '+filename+'.ps'+' -flatten '+ filename+'.png',
            function(err, stdout, stderr) {
                if (err) {
                    console.error(err);
                    console.error(stderr);
                    return callback(err);
                }
                return callback(null);
        });


    });

};

