Ext.define('Commando.view.Viewport', {
    extend: 'Ext.container.Viewport',
    title: 'Commando Container',
    requires: ['Commando.view.mongodb.Dashboard'],

    layout: 'vbox',

    initComponent: function(){
        this.items = [{
            xtype: 'mongodbdashboard',
            title: 'MongoDB Stats',
            width: 600,
            height: 400
        }];
        this.callParent();
    }
});