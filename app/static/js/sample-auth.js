window.onload = function(){

// initialize facebook
    FB.init({
        appId               :Bozuko.config.facebook.appId,
        status              :true, // check login status
        cookie              :true, // enable cookies to allow the server to access the session
        xfbml               :true  // parse XFBML
    });
    
    var b = document.getElementsByTagName('body')[0];
    function log(message){
        var p = document.createElement('p');
        p.innerHTML = message;
        b.appendChild(p);
    }
    
    log(window.location.href);
    
    function checkStatus(){
        FB.getLoginStatus(function(status){
            
            log('typeof status.session = '+(typeof status.session));
            
            if( typeof status.session == 'object' ){
                log('have session, need to test url');
                if( !/\?token/.test(window.location.href) ){
                    log('should be changing location...');
                    setTimeout( function(){
                        window.location.href = window.location.href+'?token='+status.session.access_token+'&id='+status.session.uid;
                    }, 100);
                }
            }
            else if( !status.session ){
                FB.login(checkStatus);
            }
        }, true);
    }
    
    checkStatus();

}