Ext.define('Bozuko.store.Users', {
	extend: 'Ext.data.Store',
	
	requires: ['Ext.data.reader.Json'],

    model: 'Bozuko.model.User',
	autoLoad: true
});
