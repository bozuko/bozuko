var exec = require('child_process').exec;

exports.create_png = function(barcode, encoding, filename, callback) {
    exec('barcode -b '+barcode+' -e '+encoding+' -o '+filename+'.ps'+' -u pt'+' -g 300x300 -E', function(err, stdout, stderr) {
        if (stderr.length != 0) console.error(stderr);
        if (err) {
            console.error(err);
            return callback(err);
        }

        exec('convert -density 100 '+filename+'.ps'+' -flatten '+ filename+'.png',
            function(err, stdout, stderr) {
                if (stderr.length != 0) console.error(stderr);
                if (err) {
                    console.error(err);
                    return callback(err);
                }
                return callback(null);
        });


    });

};

