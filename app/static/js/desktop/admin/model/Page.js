Ext.define('Bozuko.model.Page', {
    extend: 'Ext.data.Model',
    
    idProperty: '_id',
    
    proxy: {
		type: 'rest',
		url: '/admin/pages',
		reader: {
			type: 'json',
			root: 'items'
		}
	},
    
    fields: [
        '_id',
        'name',
        'category',
        'website',
        'image',
        'twitter_id',
        {name: 'featured', type: 'Boolean'},
        'announcement',
        {name:'active', type:'Boolean'},
        {name:'location', type:'Object'},
        {name:'coords', type:'Array'},
        'owner_id'
    ]
});