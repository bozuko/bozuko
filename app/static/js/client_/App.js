Bozuko.ns('Bozuko.client');

Bozuko.client.App = Compose( Bozuko.client.util.Observable, function(config){
    this.config = config || {};
    Compose.call( this, config || {} );
    this.$body = jQuery('<div class="app">').
        appendTo(jQuery('body'))
        ;
    setTimeout( function(){ window.scrollTo(0,1);}, 500 );
    this.render();
},{
    
    // for now, lets just start with a ticket.
    render : function(){
        this.scratch = new Bozuko.client.game.Scratch({
            renderTo: this.$body
        });
    }
    
});
(function(){
    //Bozuko.touchAsMouse();
    var instances = [];
    Bozuko.client.App.launch = function(config){
        jQuery(function(){
            instances[instances.length] = new Bozuko.client.App(config);
        });
    };
    
    Bozuko.client.App.getInstances = function(){
        return instances;
    }
    Bozuko.client.App.getInstance = function(){
        return instances[0];
    }
})();
