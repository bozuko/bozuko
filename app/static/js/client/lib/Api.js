Ext.namespace('Bozuko.client.lib');
Bozuko.client.lib.Api = Ext.extend( Ext.util.Observable, {
    
    token           :null,
    mobile_version   :'html5-1.0',
    
    constructor : function(base){
        var me = this;
        
        if( base ) me.base = base;
        else{
            var loc = window.location;
            me.base = loc.protocol+'//'+loc.host;
        }
        me.stack = [];
        me.history = [];
        me.addEvents({
            'beforecall'        :true,
            'aftercall'         :true,
            'success'           :true,
            'failure'           :true
        });
        Bozuko.client.lib.Api.superclass.constructor.call(this);
    },
    
    setToken : function(token){
        this.token = token;
    },
    
    buildParams : function(params){
        params = params || {};
        params.mobile_version = 'html5-1.0';
        if( this.token ) params.token = this.token;
        return params;
    },
    
    call : function(config, callback){
        if( this._requesting ){
            this.stack.push(arguments);
            return;
        }
        if( typeof config == 'function' ){
            callback = config;
            config = {};
        }
        else if( typeof config == 'string' ){
            config = {path: config};
        }
        
        var me = this,
            method = config.method || 'get',
            link = config.link || null,
            scope = config.scope || this,
            params = config.data || config.params || {},
            path = config.path|| '/api';
            options = {
                attempt: config.attempt || 0,
                link: link,
                path: path,
                url: me.base+path,
                method: (method=='del'?'delete':method).toUpperCase(),
                callback: me.handleResponse,
                scope: me,
                user_scope: scope || me,
                user_callback: callback
            };
            
        params = me.buildParams(params);
        options.params = params;
        /*if( method == 'get' ){
            options.url+=('?'+Ext.urlEncode(params));
        }*/
        
        options.url += (options.url.indexOf('?') != -1 ? '&' : '?') + '_dc' + '=' + (new Date().getTime());
        
        this.fireEvent('beforecall', options);
        this._requesting = true;
        Ext.Ajax.request(options);
    },
    
    handleResponse : function(options, success, response){
        var me = this,
            data;
            
        try{
            data = Ext.decode(response.responseText);
        }catch(e){
            data = {};
        }
        
        if( !data.links ) data.links = {};
        
        // everything should be in json
        var event = {
            timestamp: new Date(),
            response: response,
            status: response.status,
            path: options.path,
            link: options.link,
            options: options,
            data: data,
            ok: response.status == 200
        };
        me.history.push(event);
        me.fireEvent('aftercall', event, options.user_scope );
        me.fireEvent(success?'success':'failure', event, options.user_scope);
        if( options.user_callback ){
            options.user_callback.apply(options.user_scope, [event]);
        }
        me._requesting = false;
        if( me.stack.length ){
            me.call.apply(me, me.stack.shift());
        }
    },
    
    last : function(){
        return this.history[this.history.length-1];
    },
    
    getAt : function(i){
        return this.history[i];
    }
});