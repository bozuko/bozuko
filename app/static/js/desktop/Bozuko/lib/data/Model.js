Ext.define( "Bozuko.lib.data.Model", {
    extend: "Ext.data.Model",
    
    constructor : function(){
        var me = this;
        me.addEvents(
            'beforesave',
            'save',
            'beforedelete',
            'delete'
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
                me[association.name]().removeAll();
                me[association.name]().add(record[association.name]().data.items);
            });
            if( success && Ext.type(success) == 'function' ) success.apply( callbacks.scope || null, arguments );
        };
        me.self.load( me.getId(), callbacks );
    }

});
