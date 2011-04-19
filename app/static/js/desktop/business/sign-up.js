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
        auth_win = window.open(url+'&display=popup','auth_window','width=600,height=500');
        return true;
    });
});