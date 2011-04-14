Bozuko.view.Game = Ext.extend( Ext.Panel, {
    
    layout: 'card',
    activeItem: 0,
    
    initComponent : function(){
        this.loadingScreen = new Ext.Panel({
            cls: 'game-loading',
            layout: 'fit',
            listeners : {
                scope : this,
                render : function(){
                    this.loadingScreen.setLoading({msg:"Loading Game"});
                }
            }
        });
        this.registry = {};
        this.items = [this.loadingScreen];
        Bozuko.view.Game.superclass.initComponent.call(this);
    },
    
    loadGame : function(game, place, coords){
        this.setActiveItem(this.loadingScreen);
        Ext.Ajax.request({
            method:'get',
            url: '/place/'+place.id+'/game',
            params:{
                'lat':coords[0],
                'lng':coords[1]
            },
            callback : function(){
                this.game = game;
                this.place = place;
                if( this.gamePanel ){
                    this.gamePanel.reset();
                }
                else{
                    this.gamePanel= new Bozuko.game.Dice({
                        fps: 10      
                    });
                    this.gamePanel.on('win', this.onWin, this);
                    this.gamePanel.on('lose', this.onLose, this);
                }
                this.setActiveItem(this.gamePanel);
            },
            scope: this
        });
    },
    
    getPlace : function(){
        return this.place;
    },
    
    onWin : function(name){
        Ext.Msg.alert('You won! '+name, this.game.prize);
    },
    
    onLose : function(){
        Ext.Msg.alert('Sorry, you lose!', "Bummer... better luck next time buddy.");
    }
    
});