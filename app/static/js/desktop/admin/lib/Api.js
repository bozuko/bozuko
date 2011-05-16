
Ext.define('Bozuko.lib.Api',{
    
    requires        :[
        'Ext.Ajax',
        'Ext.util.MixedCollection'
    ],
    
    mixins          :{
        observable          :'Ext.util.Observable'
    },
    
    token           :null,
    mobile_version   :'1.0',
    phone_type      :'apibrowser',
    phone_id        :new Date().getTime(),
    
    constructor : function(base){
        var me = this;
        if( base ) me.base = base;
        else{
            var loc = window.location;
            me.base = loc.protocol+'//'+loc.host;
        }
        
        me.history = new Ext.util.MixedCollection();
        me.addEvents({
            'beforecall'        :true,
            'aftercall'         :true,
            'success'           :true,
            'failure'           :true
        });
        me.mixins.observable.constructor.call(me);
    },
    
    setToken : function(token){
        this.token = token;
    },
    
    buildParams : function(params){
        params = params || {};
        if( this.token ) params.token = this.token;
        return params;
    },
    
    call : function(path, method, params, callback, scope, link){
        var me = this,
            options = {
                link: link,
                path: path,
                url: me.base+path,
                method: method=='del'?'delete':method,
                callback: me.handleResponse,
                scope: me,
                user_scope: scope || me,
                user_callback: callback
            };
            
        params = me.buildParams(params);
        
        if( method == 'get' ){
            options.url+=('?'+Ext.urlEncode(params));
        }
        else{
            options.params = params;
        }
        this.fireEvent('beforecall', options);
        Ext.Ajax.request(options);
    },
    
    handleResponse : function(options, success, response){
        var me = this;
        
        // everything should be in json
        me.history.add({
            timestamp: new Date(),
            status: response.status,
            path: options.path,
            link: options.link,
            options: options,
            data: JSON.parse(response.responseText)
        });
        me.fireEvent('aftercall', me.last(), options.user_scope );
        me.fireEvent(me.success?'success':'failure', me.last(), options.user_scope);
        if( options.user_callback ){
            options.user_callback.apply(options.user_scope, [me.last()]);
        }
    },
    
    last : function(){
        return this.history.last();
    },
    
    getAt : function(){
        return this.history.getAt.apply(this.history, arguments);
    }
});