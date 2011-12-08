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
        this.app.on('user', this.onUserState, this);
        this.app.on('nouser', this.onUserState, this);
        this.app.on('logout', this.onLogout, this);
    },
    
    onLogout : function(){
        var self = this;
        this.state = false;
        this.game_result = false;
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
        this.updateDescription();
        this.updateState(true, function(){
            self.app.scrollToTop();
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
                    cls             :'user',
                    html            :'Loading User...'
                },{
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
                //bd.setHeight( self.$description.getHeight(true) - (bd.getXY()[1]-self.$description.getXY()[1]) );
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
            this.game.entry_method.description.split('\n')[1]
        );
        var ul = description.child('.prizes ul');
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
    
    onUserState : function(){
        // add user bar
        var description = this.getDescription();
        
        if( this.app.user ){
            description.child('.user').update('<ul class="user-links"><!--<li><a href="#" class="my-prizes">My Prizes</a></li>--><li><a class="logout" href="#">Logout</a></li></ul><div class="name">Hi <strong>'+this.app.user.name+'</strong></div>');
            description.child('.user .logout').on('click', function(){
                this.registerLoader();
                this.app.logout();
            }, this);
        }
        else{
            description.child('.user').update('You are not logged in.');
        }
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
                            cls             :'title',
                            html            :'You Win!'
                        }]
                    }]
                },{
                    cls             :'bd',
                    cn              :[{
                        cls             :'scrollable',
                        cn              :[{
                            tag             :'h3',
                            cls             :'prize-name'
                        },{
                            cls             :'prize-code'
                        },{
                            tag             :'div',
                            cls             :'message',
                            html            :''
                        },{
                            cls             :'sharebox',
                            cn              :[{
                                tag             :'label',
                                cn              :[{
                                    tag             :'input',
                                    type            :'checkbox',
                                    name            :'share',
                                    checked         :'checked'
                                },{
                                    tag             :'span',
                                    html            :'Share with your friends.'
                                }]
                            },{
                                tag             :'textarea',
                                name            :'message',
                                placeholder     :'Write a message...'
                            }]
                        }]
                    }]
                },{
                    cls             :'ft',
                    cn              :[{
                        cls             :'buttons',
                        cn              :[{
                            tag             :'a',
                            href            :'#',
                            cls             :'btn btn-close',
                            html            :'Okay'
                        }]
                    }]
                }]
            });
            this.$youWin.child('.ft').on('click', this.onYouWinButtonClick, this);
            this.squareImage(this.$youWin.child('.page-pic'), this.page.image);
            
            var youWin = this.$youWin,
                bd = this.$youWin.child('.bd'),
                ft = this.$youWin.child('.ft');
                
            bd.superScroll({
                horizontal : false,
                fixSize : function(){
                    var h = youWin.getHeight(true),
                        yy = youWin.getXY()[1],
                        y = bd.getXY()[1],
                        fh = ft.getHeight()-4;
                        
                    bd.setHeight( h - (y-yy) - fh );
                }
            });
            
        }
        if( !prize ) return this.$youWin;
        this.$youWin.prize = prize;
        
        this.$youWin[prize.shared?'addClass':'removeClass']('prize-shared');
        this.$youWin[prize.is_email?'addClass':'removeClass']('prize-is-email');
        
        this.$youWin.child('.hd .title').update(prize.state=='expired'?'Expired':prize.state=='redeemed'?'Redeemed':'You Win!');
        
        this.$youWin.child('.prize-name').update(prize.name);
        this.$youWin.child('.prize-code').update(prize.code);
        
        var message = this.$youWin.child('.message'),
            ft = this.$youWin.child('.ft')
            ;
            
        if( prize.is_email ){
            message.update([
                '<p>This prize has been emailed to <strong>'+this.app.user.email+'</strong>!</p>',
                '<p class="email-link"><a href="javascript:;">Change Email Address?</a></p>',
                '<div class="email-form">',
                    '<div><input class="email-field" placeholder="Enter your email" name="email" /></div>',
                    '<div><a href="javascript:;" class="btn btn-cancel">Canel</a><a href="javascript:;" class="btn btn-change">Change</a></div>',
                '</div>'
            ].join('\n'));
            
            var linkBlock = message.child('.email-link'),
                changeBlock = message.child('.email-form')
                ;
                
            linkBlock.setVisibilityMode(Ext.Element.DISPLAY);
            changeBlock.setVisibilityMode(Ext.Element.DISPLAY);
            
            changeBlock.hide();
            
            changeBlock.child('input').dom.value = this.app.user.email;
                
            linkBlock.child('a').on('click', function(){
                linkBlock.hide();
                changeBlock.show();
                // add new stuff...
            }, this);
            
            var changeBtn = changeBlock.child('.btn-change');
            var cancelBtn = changeBlock.child('.btn-cancel')
            
            var changing = false;
            
            changeBtn.on('click', function(){
                if( changing ) return;
                // need to update the user
                changing = true;
                cancelBtn.setStyle('opacity', .6);
                changeBtn.setStyle('opacity', .6).update('Saving...');
                var self = this;
                this.app.api.call( {
                    path: this.app.entry_point.links.user,
                    method: 'post',
                    params: {
                        email: changeBlock.child('input').dom.value
                    }
                }, function(result){
                    if( !result.data.success ){
                        alert( result.data.message );
                        changing = false;
                        cancelBtn.setStyle('opacity',1);
                        changeBtn.setStyle('opacity',1).update('Change');
                        return;
                    }
                    // need to resend
                    self.app.api.call({
                        path: prize.links.resend,
                        method: 'post'
                    }, function(result){
                        changing = false;
                        cancelBtn.setStyle('opacity',1);
                        changeBtn.setStyle('opacity',1).update('Change');
                        changeBlock.hide();
                        linkBlock.show();
                    });
                    
                });
            }, this);
            
            cancelBtn.on('click', function(){
                if( changing ) return;
                changeBlock.child('input').dom.value = this.app.user.email;
                changeBlock.hide();
                linkBlock.show();
            }, this);
        }
        else{
            message.update(
                prize.wrapper_message
            );
        }
        
        var addFooterButtons = function(){
            ft.update('');
            if( !arguments.length ) return;
            var c = arguments.length,
                o = ['<div class="buttons-'+c+'">'];
            for(var i=0; i<arguments.length; i++){
                var cfg = arguments[i];
                o.push('<div class="button-wrap"><a class="btn btn-'+(i+1)+' '+cfg.cls+'" href="#">'+cfg.text+'</a></div>');
            }
            o.push('</div>');
            ft.update(o.join(''));
        };
        
        // add footer buttons...
        if( !prize.is_email ){
            addFooterButtons({text:'Save',cls:'btn-save'},{text:'Redeem', cls:'btn-redeem'});
        }
        else{
            addFooterButtons({text:'Okay',cls:'btn-close'});
        }
        
        this.$youWin.child('.bd').superScroll().update();
        return this.$youWin;
    },
    
    onYouWinButtonClick : function(e){
        
        // whats the target, an <a> tag?
        var btn = e.getTarget('a.btn');
        if( !btn ) return;
        
        var yw = this.getYouWinScreen(),
            prize = yw.prize;
        
        btn = Ext.get(btn);
        if( !prize.shared && prize.links.share ){
            // get the share button
            if( yw.child('input[name=share]').dom.checked ){
                
                // yeah... lets share this bad larry.
                this.app.api.call({
                    path: prize.links.share,
                    params: {
                        message: yw.child('textarea[name=message]').dom.value
                    },
                    method: 'post'
                },function(result){
                    // i don't think we really need to do anything here...
                });
            }
        }
        
        yw.child('textarea[name=message]').value = '';
        
        if( btn.hasClass('btn-save') ){
            this.app.unmask();
            this.next();
        }
        else if( btn.hasClass('btn-save') ){
            this.app.unmask();
            this.next();
        }
        else{
            this.app.unmask();
            this.next();
        }
    },
    
    onAfterWin : function(){
        var self = this;
        setTimeout(function(){
            var screen = self.getYouWinScreen(self.game_result.prize);
            self.app.showModal(screen);
            screen.child('.bd').superScroll().update();
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
                
                Ext.each( result.data, function(state){
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