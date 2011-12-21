var knox = require('knox'),
    merge = knox.utils.merge,
    fs = require('fs'),
    qs = require('querystring'),
    EventEmitter = require('events').EventEmitter
;

var Client = function() {
    this.client = knox.createClient(Bozuko.config.amazon.s3);
};

Client.prototype.put = function(filename, path, headers, callback) {
    var self = this;

    if( !callback && typeof headers == 'function' ){
	callback = headers;
        headers = {};
    }

    fs.readFile(filename, function(err, buf) {
        if (err) return callback(err);
	var h = merge({
	    'x-amz-acl':'private',
	    'Content-Type': 'image/png'
	}, headers);

	h = merge(h, {'Content-Length': buf.length});

        var req = self.client.put(path, h);

        req.on('response', function(res) {
            if (res.statusCode != 200) {
                console.error('util/s3: Failed to put '+filename+' to '+path+'. status code = '+res.statusCode);
                return callback(Bozuko.error('s3/put', path));
            }

            return callback(null, req.url, res);
        });

        req.on('error', function(err) {
            console.error('util/s3: Failed to put '+filename+' to '+path+'. err = '+err);
            return callback(Bozuko.error('s3/put', path));
        });

        return req.end(buf);
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

Client.prototype.ls = function(params, callback) {
    var self = this;

    if( typeof params == 'string' ) params = {prefix:params};

    params = merge({delimiter: '/'}, params||{});

    var prefix = params.prefix;

    var req = this.client.get('?'+qs.stringify(params||{}), {}).on('response', function(response){
	var buf='';
	response.on('data', function(chunk){
	    buf+=chunk;
	});
	response.on('end', function(){
            var files = [];
	    var result = require('xml2json').toJson(buf,{object:true});
	    try{
		result.ListBucketResult.Contents.forEach(function(content){
		    if( content.Key.substr(content.Key.length-1) != '/' ){
		        files.push({
		            path: content.Key,
			    size: parseInt(content.Size,10),
			    lastModified: new Date( Date.parse(content.LastModified) ),
			    signedUrl: self.client.signedUrl('/'+content.Key,
                                new Date(Date.now()+(1000*60*60*24)) ).replace(/^http:/, 'https:')
		        });
		    }
	        });
	    } catch(e){
		// this doesn't have a valid response
		console.log(e);
	    }
	    callback(null, files);
	});
    });
    req.end();
};

module.exports = new Client();
module.exports.Client = Client;
module.exports.createClient = function() {
    return new Client();
};
