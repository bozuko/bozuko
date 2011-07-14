Ext.define('Bozuko.model.User', {
    extend: 'Ext.data.Model',
    
    idProperty: '_id',
    
    proxy: {
        type: 'rest',
        url: '/users',
        reader: {
            type: 'json',
            root: 'items'
        }
    },
    
    fields: [
        '_id',
        'name',
        'email',
        'image',
        'entry_id'
    ]
}, function(){
    this.prototype.proxy.url = Bozuko.Router.route(this.prototype.proxy.url);
});