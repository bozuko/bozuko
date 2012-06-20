Ext.define('Admin.store.ApiKeys', {
    
    extend      :'Ext.data.Store',
    requires    :['Ext.data.reader.Json'],
    model       :'Admin.model.ApiKey'
    
});
