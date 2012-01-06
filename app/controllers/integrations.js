var async = require('async'),
    qs = require('querystring'),
    MailChimpApi = Bozuko.require('util/mailchimp').Api,
    ConstantContactApi = Bozuko.require('util/constantcontact').Api,
    burl = Bozuko.require('util/url').create,
    http = Bozuko.require('util/http');

exports.routes = {

    '/mailchimp/oauth' : {
        get : function(req, res){
            var oauth_url = 'https://login.mailchimp.com/oauth2',
                client_id = Bozuko.cfg('mailchimp.client_id'),
                client_secret = Bozuko.cfg('mailchimp.client_secret'),
                code = req.param('code'),
                redirect = burl(req.url).replace(/\?.*/, ''),
                error = req.param('error');
            
            if( !code && !error ){
                return res.redirect(oauth_url+'/authorize?'+qs.stringify({
                    response_type:'code',
                    client_id: client_id,
                    redirect_uri: redirect
                }));
            }
            
            if( error ){
                return res.send(error);
            }
            
            // we have the code, lets get a token
            return http.request({
                method: 'POST',
                url: oauth_url+'/token',
                use_content_length: 1,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent':'oauth2-draft-v10',
                    'Accept': 'application/json'
                },
                params: {
                    grant_type: 'authorization_code',
                    code: code,
                    client_id: client_id,
                    client_secret: client_secret,
                    redirect_uri: redirect
                },
                returnJSON: true
            }, function(error, response){
                if( error ) return res.send(error);
                
                var access_token = response.access_token;
                                
                return http.request({
                    method: 'GET',
                    url: oauth_url+'/metadata',
                    returnJSON: true,
                    headers: {
                        'User-Agent':'oauth2-draft-v10',
                        'Accept': 'application/json',
                        'Authorization':'OAuth '+access_token
                    }
                }, function(error, response){
                    if( error ) return res.send(error);
                    
                    var props = {
                        dc : response.dc,
                        api_endpoint : response.api_endpoint,
                        access_token: access_token
                    };
                    
                    // okay... lets get the lists
                    var api = new MailChimpApi( access_token, props.dc, props.api_endpoint );
                    return api.execute('lists', {limit:100}, function(error, result, response){
                        if( error ) return res.send( error );
                        props.lists = result.data;
                        return res.send([
                            '<html><body><script>',
                            'window.opener.integration("mailchimp", '+JSON.stringify(props)+');',
                            'window.close();',
                            '</script></body></html>'
                        ].join('\n'));
                        
                    });
                    
                });
                
                return res.send(response);
            });
            
        }
    },
    
    '/constantcontact/oauth' : {
        get : function(req, res){
            var auth_url = 'https://oauth2.constantcontact.com/oauth2/oauth/siteowner/authorize',
                token_url = 'https://oauth2.constantcontact.com/oauth2/oauth/token',
                client_id = Bozuko.cfg('constant_contact.client_id'),
                client_secret = Bozuko.cfg('constant_contact.client_secret'),
                code = req.param('code'),
                username = req.param('username'),
                redirect = burl(req.url).replace(/\?.*/, ''),
                error = req.param('error');
            
            if( !code && !error ){
                return res.redirect(auth_url+'?'+qs.stringify({
                    response_type:'code',
                    client_id: client_id,
                    redirect_uri: redirect
                }));
            }
            
            if( error ){
                return res.send([
                    '<html><body><script>',
                    'window.close();',
                    '</script></body></html>'
                ].join('\n'));
            }
            
            // we have the code, lets get a token
            return http.request({
                method: 'POST',
                url: token_url,
                use_content_length: 1,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent':'oauth2-draft-v10',
                    'Accept': 'application/json'
                },
                params: {
                    grant_type: 'authorization_code',
                    code: code,
                    client_id: client_id,
                    client_secret: client_secret,
                    redirect_uri: redirect
                },
                returnJSON: true
            }, function(error, response){
                if( error ) return res.send(error);
                
                var access_token = response.access_token;
                
                var api = new ConstantContactApi( access_token, username );
                return api.execute('/lists', 'GET', function(error, response){
                    
                    var props = {
                        access_token        :access_token,
                        username            :username,
                        lists               :response.feed.entry
                    };
                    
                    return res.send([
                        '<html><body><script>',
                        'window.opener.integration("constantcontact", '+JSON.stringify(props)+');',
                        'window.close();',
                        '</script></body></html>'
                    ].join('\n'));
                });
            });
            
        }
    }

};
