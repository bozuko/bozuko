Ext.namespace('Bozuko.client.game');

Bozuko.client.game.Abstract = Ext.extend( Ext.util.Observable, {
    
    width: 320,
    height: 415,
    
    constructor : function(config){
        this.config = config;
        Ext.apply( this, config );
        this.addEvents({
            'result'            :true,
            'win'               :true,
            'lose'              :true,
            'load'              :true
        });
    }
});