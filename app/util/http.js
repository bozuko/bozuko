// HTTP Request Wrapper
var http    = require('http'),
    https   = require('https'),
    url     = require('url'),
    merge   = require('connect').utils.merge,
    qs      = require('querystring');

exports.request = function(config){
    
    
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
    
    var path = url_parsed.pathname;
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
    
    
    var request = http_.request({
        host: url_parsed.host,
        port: port,
        path: path,
        headers: headers,
        method: method
    }, function(response){
        // console.log('HTTP '+method+' '+url_parsed.host+', '+path);
        var data = '';
        response.setEncoding('utf8');
        response.on('data', function(chunk){
            data+=chunk;
            if( config.onData ){
                config.onData.call(config.scope || this, chunk, request);
            }
        });
        response.on('end', function(){
            // we should have the data
            var result = data;
            if( config.returnJSON ){
                try{
                    result = JSON.parse(data);
                }catch(e){
                    
                }
            }
            if( config.onEnd ){
                config.onEnd.call( config.scope || this, result, request);
            }
            if( config.callback ){
                config.callback.call( config.scope || this, result, request);
            }
        });
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