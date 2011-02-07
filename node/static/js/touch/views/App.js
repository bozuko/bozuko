Bozuko.view.App = Ext.extend( Ext.Panel, {
    fullscreen : true,
    layout : 'card',
    activeItem: 0,
    
    initComponent : function(){
        
        this.geo = new Ext.util.GeoLocation({
            listeners : {
                allowHighAccuracy: true,
                autoUpdate : false,
                scope : this,
                locationupdate : function(geo){
                    this.placesView.search(geo.latitude, geo.longitude);
                },
                locationerror : function(){
                    this.placesView.search();
                }
            }
        });
        
        this.backButton = new Ext.Button({
            ui                  :'back',
            text                :'Back',
            hidden              :true,
            handler             :this.onBackButtonTap,
            scope               :this
        });
        
        this.dockedItems = [{
            dock                :'top',
            xtype               :'toolbar',
            bodyPadding         :'6',
            title               :'Bozuko',
            items               :[this.backButton]
        }];
        
        this.placesView = new Bozuko.view.Places();
        this.placesView.on('itemtap', this.onPlacesViewItemTap, this);
        
        this.placeView = new Bozuko.view.Place();
        this.placeView.on('playgame', this.onPlayGame, this);
        
        this.gameView = new Bozuko.view.Game();
            
        this.items = [this.placesView, this.placeView, this.gameView];
        
        if( window.location.search ){
            var params = Ext.urlDecode(window.location.search.replace(/\?/, ''));
            if( params.view ){
                switch( params.view ){
                    case 'game':
                        this.backButton.show();
                        this.activeItem = 2;
                        this.gameView.setLoading({
                            msg:'Loading Game...'
                        });
                        Ext.Ajax.request({
                            url: '/place/'+params.place_id,
                            method:'get',
                            success : function(place){
                                this.gameView.setLoading(false);
                                place = Ext.decode(place.responseText);
                                this.playGame(null,place);
                            },
                            failure : function(){
                                this.gameView.setLoading(false);
                            },
                            scope: this
                        });
                        break;
                }
            }
        }
        else{
            this.placesView.search();
        }
        Bozuko.view.App.superclass.initComponent.call(this);
    },
    
    onBackButtonTap : function(){
        if( this.getActiveItem() == this.placeView ){
            this.setActiveItem(this.placesView, {
                type: 'slide',
                reverse: true
            });
            this.backButton.hide();
        }
        else if(this.getActiveItem() == this.gameView ){
            this.placeView.updatePlace(this.gameView.getPlace());
            this.setActiveItem(this.placeView, {
                type: 'slide',
                reverse: true
            });
        }
    },
    
    onPlacesViewItemTap : function(dataview, index, item, event){
        var r = this.placesView.getRecord(item);
        if( !this.placeView ){
            
        }
        this.placeView.updatePlace(r.data);
        this.setActiveItem(this.placeView, 'slide');
        this.backButton.show();
    },
    
    onPlayGame : function(game, place) {
        this.playGame(game,place);
    },
    
    playGame : function(game, place) {
        this.hasPermissions(Bozuko.config.facebook.perms.user.split(','),
        function success(){
            
            this.setActiveItem(this.gameView);
            this.gameView.loadGame(game, place,[this.geo.latitude,this.geo.latitude]);
        },
        function failure(){
            window.location = '/user/login?return='+escape('/?view=game&game_id='+game.id+'&place_id='+place.id);
        },
        this);
    },
    
    hasPermissions : function(perms, success, failure, scope){
        
        FB.getLoginStatus( function(response){
            var hasPermission = true;
            if( !response || !response.perms ){
                failure.apply(scope);
                return;
            }
            response.perms = Ext.decode(response.perms);
            Ext.each( perms, function(perm){
                if( response.perms.extended.indexOf(perm) == -1 ){
                    hasPermission = false;
                    return false;
                }
                return true;
            });
            if( hasPermission ){
                // we should be okay to go to the game
                success.apply(scope);
            }else{
                failure.apply(scope);
            }
        },{perms:perms});
        
    }
    
});