Ext.Loader.setConfig({enabled:true});
Ext.Loader.setPath('Ext.ux', '/js/ext-4.0/ux');
Ext.application({
    
    name: 'Bozuko',
    appFolder: '/js/desktop/admin',
    
    
    autoCreateViewport: true,

    controllers: ['Pages', 'Contests'],
    
    launch: function() {
        
        // setup our application wide controller stuff
        this.control({
            'button[text=Logout]': {
                click: this.logout
            }
        }, null, this);
        
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