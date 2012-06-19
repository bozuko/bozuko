Ext.define('Admin.model.ApiKey', {
    
    extend: 'Ext.data.Model',
    
    idProperty: '_id',
    
    requires: [
        'Bozuko.lib.Router'
    ],
    
    proxy: {
        type: 'rest',
        url: '/apikey',
        reader: {
            type: 'json',
            root: 'items',
            totalProperty: 'total'
        }
    },
    
    fields: [
        {name:'_id',                type:'String'},
        {name:'key',                type:'String'},
        {name:'name',               type:'String'},
        {name:'description',        type:'String'},
        {name:'timestamp',          type:'Date',        dateFormat:'c'}
    ]
}, function(){
    this.prototype.proxy.url = Bozuko.Router.route(this.prototype.proxy.url);
});