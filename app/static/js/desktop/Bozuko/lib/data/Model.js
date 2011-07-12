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
    
    reload : function(callbacks){
        var me = this;
        console.log(me);
        // me.self().load( me.getId(), callbacks );
    }

});
