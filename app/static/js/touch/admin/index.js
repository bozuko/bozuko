Ext.regApplication({
    
    name: 'Bozuko',
    
    launch: function() {
        Ext.dispatch({
            controller  :'App',
            action      :'launch'
        })
    }
});

Ext.ns(
    'Bozuko.lib',
    'Bozuko.views.winners'
);
