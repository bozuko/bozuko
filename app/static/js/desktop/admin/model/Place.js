Ext.define('Bozuko.model.Place', {
    extend: 'Ext.data.Model',
    
    proxy: {
        type: 'rest',
        url: '/admin/places',
        reader: {
            type: 'json',
            root: 'items'
        }
    },
    
    fields: [
        'id',
        'service',
        'category',
        'name',
        'location',
        'image'
    ]
});