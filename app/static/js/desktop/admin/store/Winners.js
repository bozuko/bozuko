Ext.define('Bozuko.store.Winners', {
    extend: 'Ext.data.Store',
    
    requires: [
        'Bozuko.model.Winner',
        'Ext.data.reader.Json'
    ],
    
    model: 'Bozuko.model.Winner',

    constructor : function(){
        this.callParent(arguments);
        this.on('beforeload', this.onBeforeLoad, this);
    },
    
    onBeforeLoad : function(store, operation){
        if( !this.page_id && !this.contest_id ) return;
        if( !operation.params ) operation.params = {};
        operation.params['page_id'] = this.page_id;
        operation.params['contest_id'] = this.contest_id;
    }
});
