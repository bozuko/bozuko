Ext.ns('Bozuko');

Bozuko.App = Ext.extend( Ext.Panel, {
    
    fullscreen              :true,
    layout                  :'card',
    cls                     :'app',
    activeItem              :0,
    
    /**
     * Functions
     */
    initComponent : function(){
        
        this.dockedItems = [{
            dock                :'top',
            xtype               :'toolbar',
            bodyPadding         :'6',
            title               :'Bozuko'
        }];
        
        this.locationScreen = new Ext.Panel({
            html : 'You must allow us to use your location'
        });
        
        this.items = [this.locationScreen];
        Bozuko.App.superclass.initComponent.call(this);
        this.startup();
    },
    
    startup : function(){
        
        Ext.Ajax.request({
            url                 :'/js/config',
            success             :function(response, obj){
                
                this.config = Ext.decode(response.responseText);
                FB.init({
                    appId               :this.config.appId,
                    status              :true, // check login status
                    cookie              :true, // enable cookies to allow the server to access the session
                    xfbml               :true  // parse XFBML
                });
                var self = this;
                FB.getLoginStatus( function(response){
                    if( response.session ){
                        // okay, we know who this is...
                        // self.updateGeo();
                        self.locationScreen.update('<img src="http://graph.facebook.com/me/picture" />');
                    }
                    else{
                        self.locationScreen.update('<a href="/auth/facebook">Login</a>');
                    }
                });
                
                
            },
            scope               :this
        });
    },
    
    updateGeo : function(){
        var geo = new Ext.util.GeoLocation({
            autoUpdate          :false,
            listeners           :{
                scope               :this,
                locationupdate      :function(loc){
                    // get the stuff from facebook
                    var self = this;
                    this.location = loc;
                    this.updatePlaces();
                },
                locationerror       :function(){
                    // can't really fall back...
                    
                }
            }
        });
        geo.updateLocation();
    },
    
    updatePlaces : function(){
        Ext.Ajax.request({
            url : '/pages',
            params : {
                'latitude':this.location.latitude,
                'longitude':this.location.longitude
            },
            method : 'post',
            scope : this,
            success : function(response){
                console.log(response);
            }
        });
    }
    
});

Ext.setup({
    onReady : function(){
        this.app = new Bozuko.App();
    }
});