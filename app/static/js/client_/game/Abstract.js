Bozuko.ns('Bozuko.client.game');

Bozuko.client.game.Abstract = Compose( Bozuko.client.util.Observable, function(config){
    this.config = config;
    Compose.call( this, config );
    this.addEvents({
        'result'            :true,
        'win'               :true,
        'lose'              :true,
        'load'              :true
    });
}, {
    width: 320,
    height: 415
});