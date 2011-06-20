Ext.define('Bozuko.store.Reports', {
    extend: 'Ext.data.Store',
    
    requires: ['Bozuko.model.Report','Ext.data.reader.Json'],

    model: 'Bozuko.model.Report',
    autoLoad: true
});
