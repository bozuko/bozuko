Bozuko.view.Places = Ext.extend( Ext.List, {
    initComponent : function(){
        this.store = new Ext.data.Store({
            autoLoad : false,
            model : 'Place',
            proxy : {
                type : 'ajax',
                url : '/places/list',
                reader : {
                    type: 'json',
                    root: 'data'
                }
            }
        });
        this.loadingText = "Finding places near you...";
        this.itemTpl = [
            '<img style="float: left; margin: 0 10px 0 0" src="https://graph.facebook.com/{id}/picture" />',
            '{name}',
            '<br /><span style="font-size:80%; color: #999;">{games.length} Games</span>'
        ];
        Bozuko.view.Places.superclass.initComponent.call(this);
        //this.geo.updateLocation();
    },
    
    searchNearby : function(){
        Bozuko.geo.updateLocation();
    },
    
    search : function(lat, lng){
        this.store.load({params:{lat:lat,lng:lng}});
    }
});