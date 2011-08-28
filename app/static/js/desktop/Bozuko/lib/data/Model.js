Ext.define( "Bozuko.lib.data.Model", {
    extend: "Ext.data.Model",
    
    constructor : function(){
        var me = this;
        me.addEvents(
            'beforesave',
            'save',
            'beforedelete',
            'delete',
            'modify'
        );
        me.callParent( arguments );
    },
    
    save : function(options){
        var me = this;
        options = Ext.apply({}, options);
        var success = options.success;
        options.success = function(){
            if( success ){
                success.call( options.scope || me, arguments );
            }
            me.fireEvent('save', me);
        };
        if( me.fireEvent('beforesave', me) === false ){
            return;
        }
        me.callParent([options]);
    },
    
    load : function(callbacks){
        var me = this;
        if( Ext.type(callbacks) == 'function' ){
            callbacks = {success: callbacks};
        }
        var success = callbacks.success;
        callbacks.success = function(record){
            if( record ) me.set(record.data);
            if( record.associations ) record.associations.each(function(association){
                if( association.type !== 'hasMany' ) return;
                var my_store = me[association.name]();
                var new_store= record[association.name]();
                new_store.each(function(item){
                    var old_record;
                    if( (old_record = my_store.getById(item.getId()))){
                        old_record.set(item.data);
                        old_record.commit();
                    }
                    else{
                        // we need to create and add a new record
                        my_store.add(item.data);
                    }
                });
                // delete items that aren't in the new_store
                my_store.each(function(item){
                    if( !new_store.getById( item.getId() ) ){
                        my_store.remove(item);
                    }
                });
            });
            if( success && Ext.type(success) == 'function' ) success.apply( callbacks.scope || null, arguments );
        };
        me.self.load( me.getId(), callbacks );
    },
    
    set : function(prop){
        var me = this;
        me.callParent(arguments);
        me.fireEvent('modify', me);
    }

});
