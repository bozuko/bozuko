Ext.namespace('Bozuko.client.game');

Bozuko.client.game.Abstract = Ext.extend( Ext.util.Observable, {
    
    width: 320,
    height: 415,
    
    lang : {
        loading : {
            entry : 'Loading...',
            result : 'Loading...'
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
            'enter'             :true,
            'displaywin'        :true,
            'displaylose'       :true
        });
        Bozuko.client.game.Abstract.superclass.constructor.call(this,config);
        
        this._saved = {
            state: this.getCache('state'),
            game_result: this.getCache('game_result')
        };
        // lets get our loader going right away...
        this.registerLoader();
        
        this.on('displaywin', this.onDisplayWin, this);
    },
    
    onDisplayWin : function(result){
        if( !result.prize ) return;
        if( !result.prize.is_email || !result.prize.links.redeem ) return;
        
        var self = this;
        
        // lets redeem!
        self.app.api.call({
            path: result.prize.links.redeem,
            method: 'post',
            params: {
                message: '',
                share: false,
                email_prize_screen: true
            }
        },function(result){
            // meh.. we are going to assume this worked.
        });
        
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
    load : function(){
        var self = this;
        if( !self.rendered ){
            self.on('render', function(){
                self.load();
            });
            return;
        }
        this.updateState(true, function(){
            self.app.hideLoading();
            self.showDescription();
        });
    },
    
    updateActionFromState : function(){
        var self = this;
        if( self.state.button_enabled === false ){
            if( !self.state.next_enter_time_ms && (self.game.entry_method.type == 'facebook/like' || self.game.entry_method.type == 'facebook/likecheckin')){
                
                var url = self.page.like_button_url;
                url+='?token='+self.app.user.token;
                
                self.updateAction(
                    '<div style="line-height: 26px;">'+
                    self.state.button_text+
                    '<iframe src="'+url+'" frameborder="0" style="display: inline-block; width: 54px; height: 26px; vertical-align:middle; margin-left: 10px;"></iframe>'+
                    '</div>'
                );
                var iframe = self.getDescription().child('iframe');
                self.getDescription().child('iframe').on('load', function(){
                    var win = iframe.dom.contentWindow || iframe.contentDocument;
                    if( !win.document ) { 
                        win= win.getParentNode();
                    }
                    win.notifyFn = function(state){
                        if( state == 'facebook/liked' ){
                            self.updateState();
                        }
                    }
                    
                }, this);
            }
            else{
                self.updateAction(self.state.button_text);
            }
        }
        else{
            self.button();
        }
    },
    
    next : function(callback){
        var self = this;
        callback = callback && typeof callback == 'function' ? callback : function(){};
        
        // lets either load or not...
        if( !self.state.button_enabled || self.state.button_action == 'enter'){
            self.updateActionFromState();
            self.showDescription();
            callback(false);
        }
        else{
            
            if( this._saved && this._saved.state && this._saved.state.user_tokens == self.state.user_tokens ){
                // might be the same ticket...
                var game_result = this._saved.game_result;
                if( game_result ){
                    this.game_result = game_result;
                    this.fireEvent('result', this.game_result);
                    callback(true);
                }
                this._saved = false;
                return;
            }
            else if( self.state.button_action == 'play'){
                self.result(function(){
                    callback();
                });
            }
        }
    },
    
    button : function(){
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
        
        var click = function(){
            if( self.state.button_action == 'enter' ){
                self.enter();
                return;
            }
            self.next(function(success){
                if(success) self.app.unmask();
            });
        };
        
        action.child('.button').on('click', click);
        
        if( self.state.user_tokens ){
            self.app.useDefaultLoader();
        }
    },
    
    updateState : function(full, callback){
        if( typeof full == 'function' ){
            callback = full;
            full = false;
        }
        var self = this,
            link = full ? this.game.game_state.links.game : this.game.game_state.links.game_state;
            
        self.app.api.call(link, function(result){
            // we need to see what the deal is...
            if( full ){
                self.setState(result.data.game_state);
                self.game = result.data;
                if( self.$description ) self.updateDescription();
            }
            else{
                self.setState(result.data);
            }
            
            self.updateActionFromState();
            if( callback && typeof callback == 'function' ) callback();
        });
    },
    
    updateAction : function(cfg){
        var action = this.getDescription().child('.actions .action');
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
                cls             :'game-description page-window',
                cn              :[{
                    cls             :'hd',
                    cn              :[{
                        cls             :'page-pic'
                    },{
                        cls             :'content',
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
                            cls             :'instructions'
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
            this.squareImage(this.$description.child('.page-pic'), this.page.image);
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
    
    updateDescription : function(){
        var description = this.getDescription();
        // add prizes...
        description.child('.instructions').update(
            this.game.entry_method.description.replace(/\n/g,'<br />')
        );
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
    
    getYouWinScreen : function(prize){
        if( !this.$youWin ){
            this.$youWin = this.app.createModal({
                cls         :'you-win page-window',
                cn          :[{
                    cls             :'hd',
                    cn              :[{
                        cls             :'page-pic'
                    },{
                        cls             :'content',
                        cn              :[{
                            tag             :'h2',
                            html            :'You Win!'
                        }]
                    }]
                },{
                    cls             :'bd',
                    cn              :[{
                        tag             :'h3',
                        cls             :'prize-name'
                    },{
                        tag             :'div',
                        cls             :'message',
                        html            :''
                    }]
                },{
                    cls             :'ft',
                    cn              :[{
                        cls             :'buttons',
                        cn              :[{
                            tag             :'a',
                            href            :'#',
                            cls             :'btn btn-close',
                            html            :'Close'
                        }]
                    }]
                }]
            });
            this.$youWin.child('.btn-close').on('click', this.closeYouWin, this);
            this.squareImage(this.$youWin.child('.page-pic'), this.page.image);
        }
        if( !prize ) return this.$youWin;
        this.$youWin.child('.prize-name').update(prize.name);
        
        var message = this.$youWin.child('.message'),
            ft = this.$youWin.child('.ft')
            ;
            
        if( prize.is_email ){
            message.update([
                'This prize has been emailed to <strong>'+this.app.user.email+'</strong>!',
                'Wrong email address? <a href="#">Change it here</a>'
            ].join('\n'));
        }
        else{
            message.update(
                prize.wrapper_message
            );
        }
        return this.$youWin;
    },
    
    closeYouWin : function(){
        // what other logic do we need here?
        this.app.unmask();
        this.next();
    },
    
    onAfterWin : function(){
        var self = this;
        setTimeout(function(){
            self.app.showModal(
                self.getYouWinScreen(self.game_result.prize)
            );
        },50);
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
    
    squareImage : function(el, src){
        var img = new Image();
        img.onload = function(){
            var $img = Ext.fly(img),
                w = img.width,
                h = img.height, 
                cw = el.getWidth(),
                ch = el.getHeight();
                
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
            el.appendChild(img);
        };
        img.src = src;
    },
    
    showDescription : function(){
        this.app.showModal(this.getDescription());
        this.getDescription().child('.bd').superScroll().update()
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
                        self.setState(state);
                        if( !self.state.user_tokens ){
                            this._playing = false;
                            self.registerLoader();
                        }
                        else{
                            self.app.useDefaultLoader();
                        }
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
    
    result : function(callback){
        var self = this;
        
        self.app.showLoading(this.lang.loading.result);
        
        self.app.api.call({
            path: self.state.links.game_result,
            method: 'post'
        },function(result){
            
            self.app.hideLoading();
            self.game_result = result.data;
            self.setState(result.data.game_state);
            
            if( !self.state.user_tokens ){
                self._playing = false;
                self.registerLoader();
            }
            else{
                self.app.useDefaultLoader();
            }
            self.updateCache('game_result');
            self.fireEvent('result', result.data);
            if( callback && typeof callback == 'function' ) callback();
        });
    },
    
    setState : function(state){
        
        var self = this;
        if( this._updateTimeout ) clearTimeout(this._updateTimeout);
        this.state = state;
        if( state.next_enter_time_ms > 0 ){
            // set a timeout
            this._updateTimeout = setTimeout( function(){
                self.updateState();
            }, state.next_enter_time_ms );
        }
        this.updateCache('state');
        this.updateActionFromState();
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