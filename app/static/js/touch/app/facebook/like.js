window.fbAsyncInit = function() {
    FB.init({
        appId : APP_ID, 
        status : true, 
        cookie : true,
        xfbml : true
    });
    
    // change the location
    var loc = window.location,
        matches = window.location.search.match(/token=(.*)(&|$)/),
        url = loc.protocol+'//'+loc.host+'/user?token='+matches[1];
        
    function onEdgeCreate( response ){
        
        document.getElementById('like-mask').style.display='block';
        
        // update the user with the latest and greatest likes...
        Bozuko.remote.HTTP.request({
            url: url,
            callback : function(){
                window.location = 'bozuko://webview.close';
            }
        })
    }
    
    FB.Event.subscribe('edge.create', onEdgeCreate);
};
(function() {
    var e = document.createElement('script'); e.async = true;
    e.src = document.location.protocol + '//connect.facebook.net/en_US/all.js';
    document.getElementById('fb-root').appendChild(e);
}());

