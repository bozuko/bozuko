Ext.define('Bozuko.store.Contests', {
    extend: 'Ext.data.Store',
    
    requires: ['Ext.data.reader.Json'],
    
    model: 'Bozuko.model.Contest',

    constructor : function(){
        this.callParent(arguments);
        this.on('beforeload', this.onBeforeLoad, this);
    },
    
    onBeforeLoad : function(store, operation){
        if( !this.page_id ) return;
        if( !operation.params ) operation.params = {};
        operation.params['page_id'] = this.page_id;
    }
});
