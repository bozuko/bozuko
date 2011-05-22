Ext.define('Bozuko.model.User', {
    extend: 'Ext.data.Model',
    
    idProperty: '_id',
    
    proxy: {
        type: 'rest',
        url: '/admin/users',
        reader: {
            type: 'json',
            root: 'items'
        }
    },
    
    fields: [
        '_id',
        'name',
        'email',
        'image'
    ]
});