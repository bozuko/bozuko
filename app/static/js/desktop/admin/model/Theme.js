Ext.define('Admin.model.Theme', {
    
    extend: 'Ext.data.Model',
    
    idProperty: '_id',
    
    requires: [
        'Bozuko.lib.Router'
    ],
    
    proxy: {
        type: 'rest',
        url: '/theme',
        reader: {
            type: 'json',
            root: 'items',
            totalProperty: 'total'
        }
    },
    
    fields: [
        {name:'_id',                type:'String'},
        {name:'timestamp',          type:'Date',        dateFormat:'c'},
        {name:'apikey_id',          type:'String'},
        {name:'name',               type:'String'},
        {name:'alias',              type:'String'},
        {name:'background',         type:'String'},
        {name:'icon',               type:'String'}
    ]
    
}, function(){
    this.prototype.proxy.url = Bozuko.Router.route(this.prototype.proxy.url);
});