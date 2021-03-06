// HTTP Request Wrapper
var http    = require('http'),
    https   = require('https'),
    url     = require('url'),
    merge   = require('connect').utils.merge,
    qs      = require('querystring');

exports.request = function(config, callback){

    if( config instanceof String){
        config = {url:config};
    }
    
    if( !config.redirect ) config.redirect = 0;
    if( typeof config.redirect !== 'boolean' && config.redirect > (config.maxRedirects || 10) ){
        return callback(new Error("Too many redirects"));
    }

    if( !callback ) {
        callback = function(){};
    }

    if( !config.url ){
        throw "Error[util::http] - request method called with no url";
    }

    var url_parsed = url.parse(config.url);

    var port = config.port || url_parsed.port || (url_parsed.protocol==='https:' ? 443 : 80);
    var ssl = config.ssl || (url_parsed.protocol === 'https:' ? true : false);

    var http_ = ssl ? https : http;

    var method = (config.method || "GET").toUpperCase();

    var path = url_parsed.pathname+(url_parsed.search||'');

    var params = url_parsed.params || false;

    if( config.params || params ){
        params = params || {};
        if( config.params ) params = merge( params, config.params);
    }

    if( method == 'GET' && params ){
        // add the params to the path
        path+=((~path.indexOf('?')?'&':'?')+qs.stringify(params));
    }

    var headers = {'host':url_parsed.host};
    if( config.headers ) headers = merge(headers, config.headers);

    var body = config.body || null,
        encoding = config.encoding || null;

    if( method == 'POST' && params && !body){
        body = qs.stringify(params);
        encoding = config.encoding || 'utf-8';
        if( config.use_content_length ) headers['Content-Length'] = body.length;
    }

    var tid,
        request_opts = {
            host: url_parsed.host.replace(/\:[0-9]+$/, ''),
            agent: false,
            port: port,
            path: path,
            headers: headers,
            method: method
        };
    
    var request = http_.request(request_opts, function(response){
        
        switch( response.statusCode ){
            case 302:
            case 301:
                
                clearTimeout( tid );
                
                if( config.redirect === false ){
                    return callback(new Error("Too many redirects"));
                }
                
                config.url = response.headers.location;
                config.method = 'get';
                config.params = {};
                config.redirect++;
                clearTimeout( tid );
                
                return exports.request(config, callback);
                
            default:
                var data = '';
                response.setEncoding( config.encoding || 'utf8');
                response.on('data', function(chunk){
                    data+=chunk;
                });
                response.on('end', function(){
                    
                    clearTimeout(tid);
                    
                    // we should have the data
                    var result = data;
                    if( config.returnJSON ){
                        try{
                            result = JSON.parse(data);
                        }catch(e){
                            return callback(Bozuko.error('http/json', method+" "+config.url, response));
                        }
                    }
                    return callback(null, result, response);
                });
        }
        return false;
    });
    
    tid = setTimeout(function() {
        console.error("http timeout: "+method+" "+config.url);
        request.abort();
        return callback(Bozuko.error('http/timeout', method+" "+config.url));
    }, config.timeout || 10000);
    
    request.on('error', function(error) {
        console.error("util/http: "+error);
        return callback(Bozuko.error('http/error_event', error));
    });

    /**
     * Not entirely sure what the upgrade event is.
     */
    if( config.onUpgrade && config.onUpgrade instanceof Function){
        request.on('upgrade', function(){
            config.onUpgrade.apply(this,arguments);
        });
    }

    /**
     * Also not entirely sure what the continue event is.
     * This is not in node 0.2.6, just 0.3+
     */
    if( config.onContinue && config.onContinue instanceof Function){
        request.on('continue', function(){
            config.onContinue.apply(this,arguments);
        });
    }
    
    if(body) request.write(body, encoding);
    request.end();

};
/**
 *
 *  Buffered option is not working yet...
 *
 */
exports.stream = function stream( _url, res, options, callback ){
    if( undefined === callback && 'function' === typeof options){
        callback = options;
        options = {};
    }
    options = options || {};

    var parsed = url.parse(String(_url)),
        ssl = /^https/.test(String(_url)),
        opts = {
            host: parsed.hostname,
            port: parsed.port || (ssl ? 443 :80),
            path: parsed.pathname + (parsed.search||'')
        },
        buffer='';


    return require(ssl ? 'https' : 'http').get( opts, function(response){
        var headers = response.headers || {};
        if( headers.location ){
            return stream( headers.location, res, options, callback );
        }
        // duplicate header
        [
            'content-type',
            'last-modified',
            'cache-control',
            'expires',
            'date'
        ]
        .forEach(function(header){
            if( headers[header] ) res.header(header, headers[header] );
        });
        
        return response.pipe( res );
    });
};

exports.redirect = function redirect( _url, res){

    this.getRedirect( _url, function( redirect_url ){
        return res.redirect( redirect_url );
    });
}

exports.getRedirect = function getRedirect( _url, callback ){

    var last = _url,
        parsed = url.parse(String(_url)),
        ssl = /^https/.test(String(_url)),
        opts = {
            host: parsed.hostname,
            port: parsed.port || (ssl ? 443 :80),
            path: parsed.pathname + (parsed.search||''),
            method: 'HEAD'
        };


    var req = require(ssl ? 'https' : 'http').request( opts, function(response){
        var headers = response.headers || {};
        if( headers.location ){
            return getRedirect( headers.location, callback );
        }
        return callback( String(_url) );
    });
    req.end();
}