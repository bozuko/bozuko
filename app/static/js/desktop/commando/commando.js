Ext.Loader.setConfig({enabled:true});
Ext.Loader.setPath('Ext.ux', '/js/ext-4.0/ux');


// This is not proper MVC. Just testing charts for now.
Ext.application({
    name: 'Commando',
    appFolder: '/js/desktop/commando',

    autoCreateViewport: true,

    controllers: ['mongodb.Dbs'],

    views: ['mongodb.Dashboard'],

    launch: function() {

    }

});