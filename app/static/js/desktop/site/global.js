jQuery(function($){
    
    function initUserBarEvents(){
        $('.user-bar .logout').click(function(e){
            var self = this;
            $(this).html('Logging out...');
            e.preventDefault();
            FB.logout(function(){
                window.location = self.href;
            });
        });
        $('.user-bar .login').click(function(e){
            var self = this;
            e.preventDefault();
            FB.login(function(response){
                if( response.session ) updateBar(function(){
                    window.location = '/my/account';
                });
            });
        });
    }
    
    function updateBar(fn){ // see if this person has logged in yet...
        FB.getLoginStatus(function(response) {
            if( response.status != 'connected' ){
                // this should show the login link already..
                return;
            }
            if( String(BozukoData.user.fbId) == String(response.session.uid) ){
                // this dude is all set already..
                return;
            }
            var params = {'accessToken':response.session.access_token};
            $.get('/site/user-bar',params,function(data){
                $('.user-bar').html(data.html);
                if( fn ) fn();
                if( data.user ) initUserBarEvents();
            });
        });
    }
    
    var fbAsyncInit = window.fbAsyncInit;
    window.fbAsyncInit = function(){
        
        if( fbAsyncInit && typeof fbAsyncInit == 'function' ) fbAsyncInit();
        
        FB.init({
            appId  : BozukoData.fbAppId,
            status : true, // check login status
            cookie : true, // enable cookies to allow the server to access the session
            xfbml  : true // parse XFBML
        });
        updateBar();
        
    };
    
    if( !$('#fb-root').length ){
        $('<div id="fb-root" />').appendTo($('body'));
        js = document.createElement('script'); js.async = true;
        js.src = "//connect.facebook.net/en_US/all.js";
        document.getElementsByTagName('head')[0].appendChild(js);
    }
    
    initUserBarEvents();
});