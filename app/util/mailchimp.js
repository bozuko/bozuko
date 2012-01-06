var http = require('./http');

var Api = module.exports.Api = function(apikey,dc,endpoint){
    this.endpoint = endpoint;
    this.key = apikey+'-'+dc;
    this.dc = dc;
};

Api.prototype.execute = function(method, params, callback){
    if( typeof params == 'function' ){
        callback = params;
        params = {};
    }
    params = params || {};
    params.apikey = this.key;
    return http.request({
        method      :'POST',
        url         :'https://'+this.dc+'.api.mailchimp.com:443/1.3/?method='+method,
        body        :JSON.stringify(params),
        returnJSON  :true,
        headers     :{
            'User-Agent'    :'bozuko/mailchimp',
            'Content-Type'  :'application/json'
        }
    }, callback);
};