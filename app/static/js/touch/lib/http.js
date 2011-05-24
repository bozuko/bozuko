window.Bozuko = window.Bozuko || {};
Bozuko.remote = (function(){
    return {
        HTTP : {
            request : function(config){
                if(!config || !config.url) return false;
                var req = new XMLHttpRequest();
                req.onreadystatechange = function(){
                    if( req.readyState == 4 && req.status == 200) {
                        if( config.callback ){
                            config.callback.call( config.scope || window, req.responseText, req.responseXML, req);
                        }
                    }
                }
                // build get request
                config.method = config.method || 'GET';
                var body = null;
                if( config.params ){
                    if( config.method == 'GET' ){
                        // create a query string...
                        if( typeof config.params !== 'string' ){
                            var params = [];
                            for( var i in config.params ){
                                if( config.params.hasOwnProperty(i)){
                                    params.push(i+'='+escape(config.params[i]));
                                }
                            }
                            config.params = params.join('&');
                        }
                        config.url += (config.url.indexOf('?') != -1 ? '&' : '?' )+config.params;
                    }
                    else{
                        body = config.params;
                    }
                }
                req.open(config.method,config.url);
                req.send(body);
                return req;
            }
        }
    }
})();