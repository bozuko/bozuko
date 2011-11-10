Ext.namespace('Bozuko.client.game');

Bozuko.client.game.Abstract = Ext.extend( Ext.util.Observable, {
    
    width: 320,
    height: 415,
    
    constructor : function(config){
        this.config = config;
        this.state = null;
        Ext.apply( this, config );
        this.addEvents({
            'result'            :true,
            'win'               :true,
            'lose'              :true,
            'load'              :true,
            'enter'             :true
        });
    },
    
    enter : function(){
        var self = this;
        
        self.app.showLoading('Loading...');
        
        // we should get the location
        //navigator.geolocation.getCurrentPosition(function(position){
            self.app.api.call({
                path: self.state.links.game_entry,
                params: {
                    ll: '1,1',
                    accuracy: '1000'
                },
                method: 'post'
            },function(result){
                
                self.app.hideLoading();
                
                result.data.forEach(function(state){
                    if( state.game_id == self.game.id ){
                        self.state = state;
                        self.fireEvent('enter', result.data);
                        return;
                    }
                });
            });
        /*}, function(){
            self.app.showLoading('We need your location to play :(');
        })*/
    },
    
    result : function(){
        var self = this;
        self.app.showLoading('Getting Your Ticket...');
        self.app.api.call({
            path: self.state.links.game_result,
            method: 'post'
        },function(result){
            self.app.hideLoading();
            self.game_result = result.data;
            self.state = result.data.game_state;
            self.fireEvent('result', result.data);
        });
    }
});