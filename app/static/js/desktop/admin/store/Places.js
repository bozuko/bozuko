Ext.define('Bozuko.store.Places', {
	
    extend      :'Ext.data.Store',
	requires    :['Ext.data.reader.Json', 'Bozuko.model.Place'],
    model       :'Bozuko.model.Place'
    
});
