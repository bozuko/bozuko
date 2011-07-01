Ext.define('Mycroft.view.Viewport', {
    extend: 'Ext.container.Viewport',
    title: 'Mycroft Container',
    requires: ['Mycroft.view.mongodb.Dashboard'],

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