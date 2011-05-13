Ext.define('Bozuko.model.Page', {
    extend: 'Ext.data.Model',
    
    idProperty: '_id',
    
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
        'name',
        'location',
        'image'
    ]
});