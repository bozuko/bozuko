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

    var body = null, encoding = null;

    if( method == 'POST' && params ){
        body = qs.stringify(params);
        encoding = config.encoding || 'utf-8';
    }

    // Set timeout to true if we don't receive a response in config.timeout ms
    var timeout = false;
    var callback_issued = false;

    var tid = setTimeout(function() {
        timeout = true;
        callback_issued = true;
        console.log("http timeout: "+method+" "+config.url);
        return callback(Bozuko.error('http/timeout', method+" "+config.url));
    }, config.timeout || 10000);

    var request = http_.request({
        host: url_parsed.host,
        agent: false,
        port: port,
        path: path,
        headers: headers,
        method: method
    }, function(response){
        var data = '';
        response.setEncoding('utf8');
        response.on('data', function(chunk){
            data+=chunk;
        });
        response.on('end', function(){

            callback_issued = true;
            // we already sent a response in the timeout callback, so just end this request
            if (timeout) return;

            clearTimeout(tid);

            // we should have the data
            var result = data;
            if( config.returnJSON ){
                try{
                    result = JSON.parse(data);
                }catch(e){
                    return callback(Bozuko.error('http/json', method+" "+config.url));
                }
            }
            return callback(null, result);
        });
    });

    request.on('error', function(error) {
        console.error("util/http: "+error);
        if (!callback_issued) {
            return callback(Bozuko.error('http/error_event', error));
        }
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

    request.end(body,encoding);

};