var knox = require('knox'),
    fs = require('fs'),
    EventEmitter = require('events').EventEmitter
;

var Client = module.exports = function() {
    this.client = knox.createClient(Bozuko.config.amazon.s3);
};

exports.createClient = function() {
    return new Client();
};

Client.prototype.put = function(filename, path, callback) {
    var self = this;
    fs.readFile(filename, function(err, buf) {
        if (err) return callback(err);

        var req = self.client.put(path, {
            'Content-Length': buf.length,
            'Content-Type': 'image/png',
            'x-amz-acl': 'private'
        });

        req.on('response', function(res) {
            if (res.statusCode != 200) {
                console.error('util/s3: Failed to put '+filename+' to '+path+'. status code = '+res.statusCode);
                return callback(Bozuko.error('s3/put', path));
            }

            return callback(null);
        });

        req.on('error', function(err) {
            console.error('util/s3: Failed to put '+filename+' to '+path+'. err = '+err);
            return callback(Bozuko.error('s3/put', path));
        });

        req.end(buf);
    });
};

Client.prototype.get = function(path, wstream) {
    var req  = this.client.get(path);

    function err() {
        console.error('util/s3: Failed to get '+path);
        return Bozuko.error('s3/get', path).send(wstream);
    }

    req.on('response', function(res) {
        if (res.statusCode != 200) {
            return err();
        }

        res.on('data', function(chunk) {
            wstream.write(chunk);
        });

        res.on('end', function() {
            wstream.end();
        });

        res.on('error', function(error) {
            return err();
        });

    });

    req.on('error', function(error) {
        return err();
    });

    req.end();
};

Client.prototype.head = function(path, callback) {
    var req  = this.client.head(path);

    function err() {
        console.error('util/s3: Failed to HEAD '+path);
        return Bozuko.error('s3/head', path);
    }

    req.on('response', function(res) {
        if (res.statusCode != 200) {
            return callback(err());
        }

	return callback(null, res.headers);
    });

    req.on('error', function(error) {
        return callback(err());
    });

    req.end();
};
