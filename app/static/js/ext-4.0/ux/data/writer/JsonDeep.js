Ext.define('Ext.ux.data.writer.JsonDeep', {
    extend: 'Ext.data.writer.Json',
    alias: 'writer.jsondeep',
    
    getRecordData: function(record) {
        var me = this,
            data = me.callParent(arguments);
        
        record.associations.each(function(association){
            if( association.type != 'hasMany' ) return;
            var key = association.associationKey;
            data[key] = [];
            if( !record[association.storeName] ) return;
            record[association.storeName].each( function(child){
                data[key].push( me.getRecordData.call(me, child) );
            });
        });
        return data;
    }
});