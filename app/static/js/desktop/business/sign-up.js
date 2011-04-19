Ext.onReady(function(){
    var button = Ext.get(Ext.DomQuery.selectNode('.fb-connect'));
    var ct = Ext.get(Ext.DomQuery.selectNode('.content-bd'));
    var auth_win =null;
    button.on('click', function(e){
        e.stopEvent();
        if( auth_win && !auth_win.closed ) return auth_win.focus();
        var url = button.dom.href;
        // we want to display the /business/login/popup
        url = url.replace(/return=[^\?\&]+/, 'return=/business/login/popup');
        var auth_w = 600,
            auth_h = 500,
            x = window.screenX,
            y = window.screenY,
            w = window.outerWidth,
            h = window.outerHeight,
            // center it.
            cx = x+w/2,
            cy = y+h/2,
            // new x, y
            ax = cx - auth_w/2,
            ay = cy - auth_h/2;
            
        auth_win = window.open(url+'&display=popup','auth_window','width='+auth_w+',height='+auth_h+',left='+ax+',top='+ay);
        return true;
    });
});