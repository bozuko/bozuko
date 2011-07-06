Ext.define('Bozuko.model.Report', {
    extend: 'Ext.data.Model',
    
    idProperty: '_id',
    
    proxy: {
        type: 'rest',
        url: '/report',
        reader: {
            type: 'json',
            root: 'items'
        },
        doRequest: function(operation, callback, scope) {
            var writer  = this.getWriter(),
                request = this.buildRequest(operation, callback, scope);
                
            if (operation.allowWrite()) {
                request = writer.write(request);
            }
            
            Ext.apply(request, {
                headers       : this.headers,
                timeout       : this.timeout,
                scope         : this,
                callback      : this.createRequestCallback(request, operation, callback, scope),
                method        : this.getMethod(request),
                disableCaching: false // explicitly set it to false, ServerProxy handles caching
            });
            
            if( this._activeRequest && this._activeRequest.abort ) this._activeRequest.abort();
            this._activeRequest = Ext.Ajax.request(request);
            
            return request;
        }
    },
    
    fields: [
        {name:'_id',        type:'String'},
        {name:'timestamp',  type:'Date'},
        {name:'count',      type:'Number',      defaultValue: 0}
    ]
}, function(){
    this.prototype.proxy.url = Bozuko.Router.route(this.prototype.proxy.url);
});