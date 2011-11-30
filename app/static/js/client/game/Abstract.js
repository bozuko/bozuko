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
        this._playing = false;
        
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
        
        // lets get our loader going right away...
        this.registerLoader();
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
    
    /**
     * load is only called on instantiation, so we can do set up
     * stuff here, like display the game description page.
     */
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
            if( self.state.button_enabled === false ){
                // we need to make it so this person likes us...
                // if( result.entry_method)
                self.app.hideLoading();
                self.updateAction(self.state.button_text);
            }
            else{
                self.playButton();
            }
        });
    },
    
    playButton : function(){
        var self = this;
        self.app.hideLoading();
        // okay... we now want to display the button
        self.updateAction([{
            cls         :'button',
            tag         :'a',
            html        :self.state.button_text || 'Play'
        },{
            cls         :'agree',
            html        :'I agree to the terms and conditions below.'
        }]);
        var action = self.getDescription().child('.actions .action');
        
        var play = function(){
            self._playing = true;
            self.app.unmask();
            self._load();
        };
        
        action.child('.button').on('click', play);
        action.child('.button').on('touchstart', play);
        
        if( self.state.user_tokens ){
            self.app.useDefaultLoader();
        }
    },
    
    updateAction : function(cfg){
        var action = this.$description.child('.actions .action');
        if( Ext.isString(cfg) ){
            action.update(cfg);
            this._loader.$el.child('.bd').superScroll().update();
            return this;
        }
        action.update('');
        if( cfg.length ) for(var i=0; i<cfg.length; i++) action.createChild(cfg[i]);
        else action.createChild(cfg);
        this._loader.$el.child('.bd').superScroll().update();
        return this;
    },
    
    getDescription : function(){
        if( !this.$description ){
            this.$description = this.app.createModal({
                cls             :'game-description',
                cn              :[{
                    cls             :'hd',
                    cn              :[{
                        cls             :'page-pic'
                    },{
                        cls             :'description',
                        cn              :[{
                            cls             :'name',
                            cn              :[{
                                tag             :'img',
                                style           :this.game.entry_method.image?'display:inline-block;':'display:none;',
                                src             :this.game.entry_method.image
                            },{
                                tag             :'span',
                                html            :this.game.name
                            }]
                        },{
                            cls             :'instructions',
                            html            :this.game.entry_method.description.replace(/\n/g,'<br />')
                        }]
                    }]
                },{
                    cls             :'actions',
                    cn              :[{
                        cls             :'action'
                    },{
                        cls             :'loader',
                        cn              :[{
                            cls             :'loading-text'
                        }]
                        
                    }]
                },{
                    
                    cls             :'bd',
                    cn              :[{
                        cls             :'scrollable',
                        cn              :[{
                            cls             :'section prizes',
                            cn              :[{
                                tag             :'h4',
                                html            :'Available Prizes'
                            },{
                                tag             :'ul',
                                cls             :'bubble'
                            }]
                        },{
                            cls             :'section terms',
                            cn              :[{
                                tag             :'h4',
                                html            :'Terms and Conditions'
                            },{
                                cls             :'bubble'
                            }]
                        }]
                    }]
                }]
            });
            this.updateDescription();
            var show = this.$description.show;
            var self = this;
            this.$description.show = function(){
                show.apply(this, arguments);
                var bd = self.$description.child('.bd');
                bd.setHeight( self.$description.getHeight(true) - (bd.getXY()[1]-self.$description.getXY()[1]) );
                self.$description.child('.bd').superScroll({
                    horizontal : false,
                    fixSize : function(){
                        bd.setHeight( self.$description.getHeight(true) - (bd.getXY()[1]-self.$description.getXY()[1]) );
                    }
                });
            };
        }
        return this.$description;
    },
    
    getLoader : function(){
        if( !this._loader ){
            var description = this.getDescription();
            var loader = new Bozuko.client.Loader( description );
            loader.on('showloading', function(){
                this.app.showModal( loader.$el );
                loader.getEl().child('.actions').addClass('loading');
                loader.$el.child('.bd').superScroll().update();
            }, this);
            loader.on('hideloading', function(){
                loader.getEl().child('.actions').removeClass('loading');
                loader.$el.child('.bd').superScroll().update();
            }, this);
            this._loader = loader;
        }
        return this._loader;
    },
    
    registerLoader : function(){
        this.app.registerLoader(this.getLoader());
    },
    
    updateDescription : function(){
        var description = this.getDescription();
        // lets go through and update our elements...
        var img = new Image();
        img.onload = function(){
            var pp = description.select('.page-pic'),
                $img = Ext.fly(img),
                w = img.width,
                h = img.height, 
                cw = pp.item(0).getWidth(),
                ch = pp.item(0).getHeight();
                
            if( w > h ){
                var p = ch/h, offset = p*w - cw;
                $img.setStyle({
                    'top' : 0,
                    'width': w*p + 'px',
                    'height': h*p + 'px',
                    'left': -offset/2 + 'px'
                });
            }
            else{
                var p = cw/w, offset = p*h - ch;
                $img.setStyle({
                    'top' : -offset/2,
                    'width': w*p + 'px',
                    'height': h*p + 'px',
                    'left': 0 + 'px'
                });
            }
            description.select('.page-pic').appendChild(img);
        };
        img.src = this.page.image;
        
        // add prizes...
        var ul = description.select('.prizes ul').item(0);
        ul.update('');
        for(var i=0; i<this.game.prizes.length; i++){
            var p = this.game.prizes[i];
            ul.createChild({
                tag         :'li',
                html        :p.name
            });
        }
        
        // add terms...
        description.child('.terms .bubble').update(this.game.rules.replace(/\n/g,'<br />') );
        
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
                        if( !self.state.user_tokens ){
                            this._playing = false;
                            self.registerLoader();
                        }
                        else{
                            self.app.useDefaultLoader();
                        }
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
            
            if( !self.state.user_tokens ){
                this._playing = false;
                self.registerLoader();
            }
            else{
                self.app.useDefaultLoader();
            }
            
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