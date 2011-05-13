Ext.define('Bozuko.model.Page', {
    extend: 'Ext.data.Model',
    
    idProperty: '_id',
    
    proxy: {
		type: 'rest',
		url: '/admin/contests',
		reader: {
			type: 'json',
			root: 'items'
		}
	},
    
    fields: [
        '_id',
        'name'
    ]
});