Ext.USE_NATIVE_JSON = true;
Ext.Loader.setConfig({enabled:true});
Ext.Loader.setPath('Ext.ux', '/js/ext-4.0/ux');
Ext.Loader.setPath('Bozuko', '/js/desktop/Bozuko');
Ext.application({

    name: 'Admin',
    appFolder: '/js/desktop/admin',

    autoCreateViewport: true,
    controllers: [
        'Bozuko.controller.Pages',
        'Bozuko.controller.Contests',
        'Admin'
    ],

    requires:[
        'Bozuko.lib.Router',
        'Ext.chart.theme.Base',
        'Ext.chart.series.Series'
    ],

    launch: function() {
        var me = this;
        // setup our application wide controller stuff
        this.control({
            'button[text=Logout]': {
                click: this.logout
            }
        }, null, this);

        // prevent unintentional leaving of the page
        window.onbeforeunload = function(){
            return me.preventCloseWarning
                ? false
                : 'If you leave this page, any unsaved worked will be lost.';
        };

    },

    logout : function(){
        var self = this;
        if( !this._window ) this._window = Ext.create('Ext.window.Window',{
            title: 'Logout',
            authHeight: true,
            width: 400,
            layout: 'fit',
            bodyPadding: 20,
            html:'You need to restart your browser to logout properly.',
            listeners:{
                close: function(){
                    delete self._window;
                }
            }
        });

        this._window.show();

    }
});