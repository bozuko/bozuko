Ext.ns('Bozuko', 'Bozuko.view');

Ext.setup({
    phoneStartupScreen: 'startup.png',
    icon: 'icon.png',
    glossOnIcon: false,
    
    onReady: function() {
        // initialize facebook
        FB.init({
            appId               :Bozuko.config.facebook.appId,
            status              :true, // check login status
            cookie              :true, // enable cookies to allow the server to access the session
            xfbml               :true  // parse XFBML
        });
        var app = new Bozuko.view.App();
    }
});