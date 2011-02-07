Ext.ns('Bozuko');

Ext.onReady(function(){
    // initialize facebook
    FB.init({
        appId               :Bozuko.config.facebook.appId,
        status              :true, // check login status
        cookie              :true, // enable cookies to allow the server to access the session
        xfbml               :true  // parse XFBML
    });
    
    function refresh(){
        window.location = window.location;
    }
    
    // check for login status and update the header...
    FB.getLoginStatus(function(status){
        if( status && status.session ){
            if( status.session.uid != _uid ) refresh();
        }
    });
    
    FB.Event.subscribe('auth.logout', refresh);
    FB.Event.subscribe('auth.login', refresh);
    
    Ext.select('.login').on('click', function(e){
        //e.stopEvent();
        //FB.login();
    });
    
});