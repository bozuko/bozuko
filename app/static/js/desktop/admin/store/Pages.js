Ext.define('Bozuko.store.Pages', {
	extend: 'Ext.data.Store',
	
	requires: ['Ext.data.reader.Json'],

    model: 'Bozuko.model.Page',
	
	autoLoad: true
});
