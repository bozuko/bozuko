Ext.define('Bozuko.model.Place', {
    extend: 'Ext.data.Model',
    
    proxy: {
        type: 'rest',
        url: '/places',
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
        'image',
		'data',
		'website'
    ]
}, function(){
    this.prototype.proxy.url = Bozuko.Router.route(this.prototype.proxy.url);
});