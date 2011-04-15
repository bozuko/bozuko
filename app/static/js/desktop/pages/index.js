Ext.onReady(function(){
    /*
    // okay, lets setup the main area here.
    var lat = geoip_latitude(),
        lng = geoip_longitude();
        
    var places = Ext.get('places');
    
    var tmpl = new Ext.Template(Ext.fly('place-tmpl').dom.innerHTML);
    
    function geoSuccess(geo){
        lat = geo.latitude;
        lng = geo.longitude;
        getPlaces();
    }
    
    function geoFailure(){
        getPlaces();
    }
    
    function getPlaces(){
        Ext.Ajax.request({
            method:'GET',
            url:'/places/list',
            scope:this,
            params:{
                limit: 6,
                lat:lat,
                lng:lng
            },
            success:function(res){
                var result = Ext.decode(res.responseText);
                if( result && result.data ){
                    console.log(result.data);
                    populatePlaces(result.data);
                }
            }
        });
    }
    
    function populatePlaces(data){
        Ext.each(data, function(entry){
            tmpl.append(places,entry);
        });
    }
    
    if( window.navigator.geolocation ){
        window.navigator.geolocation.getCurrentPosition(geoSuccess, geoFailure);
    }
    else{
        geoFailure();
    }
    */
});