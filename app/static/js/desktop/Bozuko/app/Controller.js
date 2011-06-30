Ext.define('Bozuko.app.Controller', {
    extend : 'Ext.app.Controller',
    
    createGetters: function(type, refs) {
        Ext.Array.each(refs, function(ref) {
            var fn = 'get',
                parts = ref.split('.'),
                re = new RegExp('^Bozuko\\.'+type);
            
            if( !re.test(ref) ) return;
            
            // remove the Bozuko namespace and the type
            parts.shift();
            parts.shift();

            // Handle namespaced class names. E.g. feed.Add becomes getFeedAddView etc.
            Ext.Array.each(parts, function(part) {
                fn += Ext.String.capitalize(part);
            });
            fn += Ext.String.capitalize(type);

            if (!this[fn]) {
                this[fn] = Ext.Function.pass(this['get' + Ext.String.capitalize(type)], [ref], this);
            }
        },
        this);
        this.callParent(arguments);
    },
    
});