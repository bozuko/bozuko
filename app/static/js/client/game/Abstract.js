Ext.namespace('Bozuko.client.game');

Bozuko.client.game.Abstract = Ext.extend( Ext.util.Observable, {
    
    width: 320,
    height: 415,
    
    lang : {
        loading : {
            entry : 'Loading...',
            result : 'Getting your Ticket...'
        }
    },
    
    constructor : function(config){
        this.config = config;
        this.state = null;
        
        this._images = {};
        this._srcs = {};
        this._imagesLoaded = 0;
        this._imageCount = 0;
        this._ready = false;
        
        Ext.apply( this, config );
        this.addEvents({
            'ready'             :true,
            'result'            :true,
            'win'               :true,
            'lose'              :true,
            'load'              :true,
            'enter'             :true
        });
        Bozuko.client.game.Abstract.superclass.constructor.call(this,config);
    },
    
    addImage : function(key, src, onload, load){
        var self = this;
        
        if( this._images[key] ) return;
        var img = this._images[key] = new Image();
        img.onload = function(){
            self._imagesLoaded++;
            img.loaded = true;
            if( self._imagesLoaded == self._imageCount  ){
                self._ready = true;
                self.fireEvent('ready', self);
            }
            if( onload && onload instanceof Function ) onload(this);
        };
        this._srcs[key] = src;
        this._imageCount++;
        if( load || onload === true ) img.src = src;
    },
    
    isReady : function(){
        return this._ready;
    },
    
    loadImages : function(cb){
        for(var key in this._srcs ){
            var img = this._images[key];
            if( !img.loaded ) img.src = this._srcs[key];
        }
    },
    
    image : function(key){
        return this._images[key];
    },
    
    load : function(callback){
        var self = this;
        if( !self.rendered ){
            self.on('render', function(){
                self.load(callback);
            });
            return;
        }
        this.app.api.call(this.game.game_state.links.game_state, function(result){
            // we need to see what the deal is...
            self.state = result.data;
            if( result.button_enabled === false ){
                // we need to make it so this person likes us...
                // if( result.entry_method)
            }
            else{
                callback(null, true);
                self._load();
            }
        });
    },
    
    render : function(){
        
    },
    
    _load : function(){
        
    },
    
    enter : function(){
        var self = this;
        
        self.app.showLoading(this.lang.loading.entry);
        
        // check the game - do we need to get location?
        function do_entry(lat,lng,accuracy){
            self.app.api.call({
                path: self.state.links.game_entry,
                params: {
                    ll: lat+','+lng,
                    accuracy: accuracy
                },
                method: 'post'
            },function(result){
                
                self.app.hideLoading();
                
                result.data.forEach(function(state){
                    if( state.game_id == self.game.id ){
                        self.state = state;
                        
                        self.updateCache('state');
                        
                        self.fireEvent('enter', result.data);
                        return;
                    }
                });
            });
        }
        
        if( self.game.entry_method.type.match(/checkin/)){
            // we should get the location
            navigator.geolocation.getCurrentPosition(function(position){
                do_entry(position.coords.latitude, position.coords.longitude, position.coords.accuracy);
            }, function(){
                self.app.showLoading('We need your location to play :(');
            })
        }
        else{
            do_entry(0,0);
        }
    },
    
    result : function(){
        var self = this;
        self.app.showLoading(this.lang.loading.result);
        self.app.api.call({
            path: self.state.links.game_result,
            method: 'post'
        },function(result){
            self.app.hideLoading();
            self.game_result = result.data;
            self.state = result.data.game_state;
            
            self.updateCache('game_result');
            self.updateCache('state');
            
            self.fireEvent('result', result.data);
        });
    },
    
    getCache : function(key){
        return this.app.cache(key+'_'+this.game.id);
    },
    
    updateCache : function(key, value){
        if( !value ) value = this[key];
        return this.app.cache(key+'_'+this.game.id, value);
    },
    
    clearCache : function(key){
        this.app.cache(key+'_'+this.game.id, false);
    }
});