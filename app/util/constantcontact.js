var http = require('./http'),
    xml2json = require('xml2json')
    ;

var BASE_URI = 'https://api.constantcontact.com';

var Api = module.exports.Api = function(token, username){
    this.token = token;
    this.username = username;
    this.base = BASE_URI+'/ws/customers/'+this.username;
};

Api.prototype.execute = function(path, method, body, callback){
    if( typeof body === 'function' ){
        callback = body;
        body = null;
    }
    var opts = {
        method      :method,
        url         :this.base+path,
        headers     :{
            'User-Agent'    :'bozuko/constantcontact',
            'Accept'        :'application/atom+xml',
            'Authorization' :'Bearer '+this.token
        }
    };
    if( body ){
        opts.headers['Content-Type'] = 'application/atom+xml';
        opts.use_content_length = true;
        opts.body = body;
    }
    
    return http.request(opts, function(error, response){
        if( error ) return callback( error );
        try{
            return callback( null, xml2json.toJson( response, {object: true} ) );
        }catch(e){
            return callback( new Error(response) );
        }
    });
};