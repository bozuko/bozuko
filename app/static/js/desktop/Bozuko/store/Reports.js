Ext.define('Bozuko.store.Reports', {
    extend: 'Ext.data.Store',
    
    requires: ['Bozuko.model.Report','Ext.data.reader.Json'],
    
    proxy: {
        type: 'rest',
        url: '/report',
        reader: {
            type: 'json',
            root: 'items',
            getResponseData : function(){
                var data = Ext.data.reader.Json.prototype.getResponseData.apply(this, arguments);
                this._unit = data.unit;
                this._label = data.label;
                return data;
            }
        }
    },

    model: 'Bozuko.model.Report',
    autoLoad: true,
    
    getUnit : function(){
        return this.proxy.reader._unit || 'day';
    },
    
    getLabel : function(){
        return this.proxy.reader._label || 'Day';
    }
    
}, function(){
    this.prototype.proxy.url = Bozuko.Router.route(this.prototype.proxy.url);
});
