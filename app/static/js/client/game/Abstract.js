Ext.namespace('Bozuko.client.game');

Bozuko.client.game.Abstract = Ext.extend( Ext.util.Observable, {
    
    width: 320,
    height: 415,
    
    useCache : false,
    autoPlay : true,
    
    lang : {
        loading : {
            entry : 'Loading...',
            result : 'Loading...',
            user: 'Loading User...'
        },
        agreeToOfficialRules : 'I agree to the Official Rules below.',
        officialRules: 'Official Rules',
        availablePrizes: 'Available Prizes',
        myPrizes: 'My Prizes',
        backToGame: 'Back to game',
        shareThisGame: 'Share This Game!',
        visitFacebookPage: 'Visit our Facebook Page',
        youWin: 'You Win!',
        prizeDetails: 'Prize Details',
        sentEmail: '<p>This prize has been emailed to <strong class="user-email">{0}</strong>! '+
                   'Please ensure it didn\'t land in your spam folder.</p>'
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
            'render'            :true,
            'ready'             :true,
            'result'            :true,
            'beforeresult'      :true,
            'afterresult'       :true,
            'win'               :true,
            'lose'              :true,
            'load'              :true,
            'enter'             :true,
            'displaywin'        :true,
            'displaylose'       :true,
            'statechange'       :true
        });
        Bozuko.client.game.Abstract.superclass.constructor.call(this,config);
        
        this.on('render', function(){
            this.app.fireEvent('render_game', this, this.app);
        }, this);
        
        this.app.fireEvent('filter_game', this);
        
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
        if( !(result.prize.address_required || result.prize.is_pdf || result.prize.is_email || result.prize.is_barcode || this.app.email_only) || !result.prize.links.redeem ) return;
        //if( result.prize.address_required && !this.app.user.city ) return;
        
        var self = this;
        
        // lets redeem!
        var redeem = function(attempt){
            attempt = attempt || 0;
            self.app.api.call({
                path: result.prize.links.redeem,
                method: 'post',
                params: {
                    message: '',
                    share: false,
                    email_prize_screen: true
                }
            },function(result){
                if( !result.ok ){
                    if( attempt < 5 ) redeem(attempt+1);
                }
                // meh.. we are going to assume this worked.
                // this could be where youWin disappears... lets make sure
                // its still showing...
                if( self._showingYouWin){
                    self.showYouWin();
                }
            });
        }
        
        redeem();
        
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
            if( !img.loaded ){
                var src = this._srcs[key];
                if( !src.match(/^data/i) ){
                    src+=((~src.indexOf('?')?':':'?')+'dc='+this.app.config.cache_time);
                }
                img.src = src;
            }
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
        this.updateState(true, function(result){
            if( !result.ok ){
                self.updateAction('Error');
                return;
            }
            self.app.scrollToTop();
            self.showDescription();
            self.app.hideLoading();
        });
    },
    
    updateActionFromState : function(){
        var self = this,
            sharebuttons = self.getDescription().$shareButtons;
        
        sharebuttons.setStyle('display','none');
        if( self.state.button_enabled === false ){
            if( !self.state.button_text.match(/(this game starts|thanks for playing|this game has ended)/i) && !self.state.next_enter_time_ms && (self.game.entry_method.type == 'facebook/like' || self.game.entry_method.type == 'facebook/likecheckin')){
                
                if( self.getDescription().child('iframe.like-button-frame') ) return;
                
                var url = self.page.like_button_url;
                url+='?token='+self.app.user.token;
                
                // also add the game
                url+='&game='+self.game.id;
                
                self.updateAction(
                    '<div style="line-height: 26px;" class="like-container like-container-loading">'+
                    self.state.button_text+
                    '<span class="like-loading">'+
                        '<span class="loading">&nbsp;</span>'+
                    '</span>'+
                    '<iframe id="likeFrame" name="likeFrame" src="'+url+'" frameborder="0" scrolling="no" class="like-button-frame"></iframe>'+
                    '</div>'
                );
                
                var ct=self.getDescription().child('.like-container'),
                    frame=0,
                    loader=self.getDescription().child('.like-loading .loading'),
                    interval = setInterval(function(){
                        loader.setStyle('background-position', (-frame*16)+'px 0');
                        frame++;
                        if( frame > 7 ) frame=0;
                    }, 100);
                
                window.notifyFn = function(state){
                    switch(state){
                        
                        case 'facebook/like_loaded':
                            clearInterval(interval);
                            ct.removeClass('like-container-loading');
                            break;
                        
                        case 'facebook/liked':
                            self.updateState(true);
                            break;
                    }
                }
                
            }
            else{
                self.updateAction(self.state.button_text);
                if( self.state.button_text.match(/(thanks for playing|play again in|this game has ended)/i) ){
                    sharebuttons.setStyle('display','block');
                    if( self.state.button_text.match(/(thanks for playing|this game has ended)/i) ){
                        sharebuttons.addClass('game-over');
                    }
                    else{
                        sharebuttons.removeClass('game-over');
                    }
                }
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
            
            if( this.useCache && this._saved && this._saved.state && this._saved.state.user_tokens == self.state.user_tokens ){
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
            else if( self.state.button_action == 'play' && self.autoPlay ){
                self.result(function(){
                    callback();
                });
            }
            else {
                callback(true);
            }
        }
    },
    
    button : function(){
        var self = this;
        // okay... we now want to display the button
        self.updateAction([{
            cls         :'button',
            tag         :'a',
            html        :self.state.button_text || 'Play'
        },{
            cls         :'agree',
            html        :this.lang.agreeToOfficialRules
        }]);
        var action = self.getDescription().child('.actions .action');
        
        var click = function(){
            if( self.state.button_action == 'enter' ){
                self.enter();
                return;
            }
            if( self.state.user_tokens ){
                self.app.useDefaultLoader();
            }
            self.next(function(success){
                if(success) self.app.unmask();
            });
        };
        
        action.child('.button').dom.onclick = click;
    },
    
    updateState : function(full, callback){
        if( typeof full == 'function' ){
            callback = full;
            full = false;
        }
        var self = this,
            link = full ? this.game.game_state.links.game : this.game.game_state.links.game_state;
            
        self.app.api.call(link, function(result){
            if( !result.ok ){
                if( callback && typeof callback == 'function' ) callback(result);
                return;
            }
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
            if( callback && typeof callback == 'function' ) callback(result);
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
        var self = this;        
        if( !this.$description ){
            // get the window width
            var mobile = Modernizr.touch;
            var url = (function(l){
                return l.protocol+'//'+l.host+l.pathname+'?share-button=1';
            })(window.location);
            
            this.$description = this.app.createModal({
                cls             :'game-description page-window modal-window-full',
                cn              :[{
                    cls             :'user top-bar',
                    html            :this.lang.loading.user
                },{
                    cls             :'hd',
                    cn              :[{
                        cls             :'page-pic'
                    },{
                        cls             :'content',
                        cn              :[{
                            cls             :'name',
                            cn              :[{
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
                    },{
                        cls             :'share-buttons',
                        cn              :[{
                            tag             :'ul',
                            cls             :'links',
                            cn              :[{
                                tag             :'li',
                                cls             :'share',
                                cn              :[{
                                    tag             :'a',
                                    target          :'_blank',
                                    // href            :'http://www.addthis.com/bookmark.php',
                                    // href            :'/client/share/'+(mobile?'m':'www')+'?url='+encodeURIComponent(url)+'&t='+encodeURIComponent(this.game.name)+'&display=popup',
                                    href            :'http://'+(mobile?'m':'www')+'.facebook.com/sharer.php?'
                                                        +'u='+encodeURIComponent(url)
                                                        +'&display=popup',
                                    html            :this.lang.shareThisGame,
                                    cls             :'share-btn'
                                }]
                            },{
                                tag             :'li',
                                cls             :'facebook',
                                cn              :[{
                                    tag             :'a',
                                    target          :'_blank',
                                    href            :this.page.facebook_page,
                                    html            :this.lang.visitFacebookPage,
                                    cls             :'facebook'
                                }]
                            }]
                        }]
                    }]
                },{
                    
                    cls             :'bd',
                    cn              :[{
                        cls             :'scrollable',
                        cn              :[{
                            cls             :'above-prizes'
                        },{
                            cls             :'section prizes',
                            cn              :[{
                                tag             :'h4',
                                html            :this.lang.availablePrizes
                            },{
                                tag             :'ul',
                                cls             :'bubble'
                            }]
                        },{
                            cls             :'section copy',
                            cn              :[{
                                cls             :'content'
                            }]
                        },{
                            cls             :'section terms',
                            cn              :[{
                                tag             :'h4',
                                html            :this.lang.officialRules
                            },{
                                cls             :'bubble'
                            }]
                        }]
                    }]
                }]
            });
            
            this.$description.$shareButtons = this.$description.child('.share-buttons');
            this.$description.$shareButtons.setVisibilityMode(Ext.Element.DISPLAY);
            
            this.$copySection = this.$description.child('.section.copy');
            this.$copySection.setVisibilityMode(Ext.Element.DISPLAY);
            this.$copySection.hide();
            
            var btn = this.$description.$shareButtons.child('.share-btn');
            btn.on('click', function(e){
                if( window._gaq ) _gaq.push(['_trackEvent', 'Web Game', 'Share', self.game.name+': '+self.game.id]);
                e.stopEvent();
                var opts = {
                    method: 'feed',
                    place: self.page.facebook_id,
                    caption: self.page.name,
                    link: self.game.share_url,
                    name: self.game.share_title,
                    description: self.game.share_description,
                    picture: self.page.image
                };
                if( !mobile ) opts.display = 'popup';
                FB.ui(opts, function(response){
                    if( response && response.post_id ){
                        self.app.api.call({
                            path: '/game/'+self.game.id+'/shared/'+response.post_id,
                            method: 'post'
                        }, function(response){
                            // don't need to do anything with it...
                        });
                    }
                });
            });
            this.squareImage(this.$description.child('.page-pic'), this.page.image);
            this.updateDescription();
            var show = this.$description.show;
            this.$description.show = function(){
                show.apply(this, arguments);
                var bd = self.$description.child('.bd');
                //bd.setHeight( self.$description.getHeight(true) - (bd.getXY()[1]-self.$description.getXY()[1]) );
                self.$description.child('.bd').superScroll({
                    horizontal : false,
                    fixSize : function(){
                        bd.setHeight( self.$description.getHeight(true)+4 - (bd.getXY()[1]-self.$description.getXY()[1]) );
                    }
                });
            };
            this.app.fireEvent('filter_game_description', this.$description, this );
        }
        return this.$description;
    },
    
    updateDescription : function(){
        var self = this;
        var description = this.getDescription();
        
        // add prizes...
        var instructions = this.game.entry_method.description.split('\n');
        instructions.shift();
        instructions[0] = '<strong>'+instructions[0]+'</strong>';
        description.child('.instructions').update(
            instructions.join('<br />')
        );
        var ul = description.child('.prizes ul');
        ul.update('');
        this.fireEvent('updatedescription', description);
        var prizes = this.game.prizes;
        if( this.game.consolation_prizes && !this.game.hide_consolations ){
            prizes = prizes.concat( this.game.consolation_prizes );
        }
        for(var i=0; i< prizes.length; i++){
            var p = prizes[i];
            var li = ul.createChild({
                tag         :'li',
                cn          :[{
                    cls         :'name',
                    cn          :[{
                        tag         :'span',
                        html        :p.name
                    }]
                },{
                    cls         :'description',
                    html        :p.description
                }]
            });
            if( p.result_image ){
                var image =li.child('.name').createChild({
                    tag         :'img',
                    src         :p.result_image,
                    cls         :'result-image'
                });
                li.child('.name').insertFirst(image);
            }
            if( p.description ){
                (function(li){
                    var trigger = li.child('.name').createChild({
                        cls         :'trigger'
                    });
                    li.child('.name').insertFirst(trigger);
                    li.addClass('has-description');
                    var fn = function(e){
                        e.stopEvent();
                        li.toggleClass('show-description');
                    };
                    trigger.on(Modernizr.touch?'touchstart':'mousedown', fn, this);
                })(li);
            }
        }
        // check 
        if( this.game.ingame_copy ){
            if( !this._ingame_copy ){
                this.$copySection.child('.content').update(this.game.ingame_copy, true);
                this.$copySection.show();
                this._ingame_copy = true;
            }
        }
        else {
            this.$copySection.child('.content').update('');
            this.$copySection.hide();
        }
        
        // add terms...
        var terms = this.game.rules
            .replace(/\n/g,'<br />')
            .replace(/(www\..+\.com)/ig, 'http://$1' )
            .replace(/(\b(https?):\/\/[\-A-Z0-9+&@#\/%?=~_|!:,.;]*[\-A-Z0-9+&@#\/%=~_|])/ig, '<a target="_blank" href="$1">$1</a>' )
            .replace(/([\-A-Z0-9+_.]+?@[\-A-Z0-9+&@#\/%?=~_|!:,.;]*[\-A-Z0-9+&@#\/%=~_|])/ig, '<a href="mailto:$1">$1</a>')
            
        description.child('.terms .bubble').update( terms );
    },
    
    onUserState : function(){
        // add user bar
        var self = this,
            description = this.getDescription();
        
        if( this.app.user ){
            description.child('.user').update('<ul class="user-links"><li class="my-prizes-li" style="display: none;"><a href="javascript:;" class="my-prizes">'+this.lang.myPrizes+'</a></li><li><a class="logout" href="javascript:;">Logout</a></li></ul><div class="name">Hi <strong>'+this.app.user.name+'</strong></div>');
            description.child('.user .logout').on('click', function(){
                this.registerLoader();
                this.app.logout();
            }, this);
            description.child('.user .my-prizes').on('click', function(){
                this.showMyPrizes();
            }, this);
            self.updatePrizes();
        }
        else{
            description.child('.user').update('You are not logged in.');
        }
    },
    
    updatePrizes : function(){
        
        var self = this,
            description = this.getDescription();
            
        self.app.api.call({
            path: self.app.entry_point.links.prizes,
            method: 'get',
            params:{
                game_id: self.game.id
            }
        }, function(response){
            if( !response.ok ){
                return;
            }
            var result = response.data;
            self.prizes = result.prizes;
            if( !result.prizes.length ) return;
            description.child('.my-prizes-li').setStyle('display', '');
        });
    },
    
    showYouWin : function(prize){
        var screen = this.getYouWinScreen(prize)
        this.app.showModal( screen );
        screen.child('.bd').superScroll().update();
    },
    
    getYouWinScreen : function(prize){
        if( !this.$youWin ){
            this.$youWin = this.app.createModal({
                cls         :'you-win page-window modal-window-full',
                cn          :[{
                    cls             :'hd',
                    cn              :[{
                        cls             :'page-pic'
                    },{
                        cls             :'content',
                        cn              :[{
                            tag             :'h2',
                            cls             :'title',
                            html            :this.lang.youWin
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
                            cls             :'prize-desc',
                            cn              :[{
                                cls             :'arrow-border'
                            },{
                                cls             :'arrow'
                            },{
                                cls             :'text'
                            }]
                        },{
                            cls             :'prize-code'
                        },{
                            cls             :'body',
                            cn              :[{
                                tag             :'div',
                                cls             :'message',
                                html            :''
                            }]
                        },{
                            cls             :'redemption',
                            cn              :[{
                                cls             :'security',
                                cn              :[{
                                    cls             :'text',
                                    html            :'Security Image'
                                },{
                                    cls             :'image'
                                },{
                                    cls             :'time'
                                }]
                            }]
                        },{
                            cls             :'prize-screen',
                            cn              :[{
                                tag             :'h2',
                                cls             :'code'
                            },{
                                tag             :'h3',
                                cls             :'time'
                            },{
                                tag             :'p',
                                cls             :'description'
                            },{
                                tag             :'p',
                                cls             :'expiration'
                            }]
                        }]
                    }]
                },{
                    cls             :'ft',
                    cn              :[{
                        cls             :'ft-padding',
                        cn              :[{
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
                                    html            :'Share this win with your friends.'
                                }]
                            }]
                        },{
                            cls             :'buttons',
                            cn              :[{
                                tag             :'a',
                                href            :'#',
                                cls             :'btn btn-close',
                                html            :'Okay'
                            }]
                        }]
                    }]
                }]
            });
            
            this.app.fireEvent('filter_you_win', this.$description, this );
            
            this.$youWin.child('.ft').on('click', this.onYouWinButtonClick, this);
            this.squareImage(this.$youWin.child('.page-pic'), this.page.image);
            
            var youWin = this.$youWin,
                bd = this.$youWin.child('.bd'),
                ft = this.$youWin.child('.ft'),
                desc = this.$youWin.child('.prize-desc');
                
            desc.setVisibilityMode( Ext.Element.DISPLAY );
            this.$youWin.child('.prize-name').on('click', function(){
                if( self._screen ) return;
                desc.toggle();
            });
                
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
        
        this.$youWin.removeClass('prize-active');
        this.$youWin.removeClass('prize-redeemed');
        this.$youWin.removeClass('prize-expired');
        
        this.$youWin.addClass('prize-'+prize.state);
        
        this.$youWin[prize.shared?'addClass':'removeClass']('prize-shared');
        this.$youWin[prize.is_email||prize.is_pdf?'addClass':'removeClass']('prize-is-email');
        this.$youWin[prize.is_barcode?'addClass':'removeClass']('prize-is-barcode');
        this.$youWin[!prize.is_barcode&&!prize.is_email&&!prize.is_pdf?'addClass':'removeClass']('prize-is-user-redeemable');
        
        this.$youWin.child('.hd .title').update(this.lang.youWin); //prize.state=='expired'?'Expired':prize.state=='redeemed'?'Redeemed':'You Win!');
        
        this.$youWin.child('.prize-name').update(prize.name);
        this.$youWin.child('.prize-desc .text').update('<strong>'+this.lang.prizeDetails+':</strong> '+prize.description);
        this.$youWin.child('.prize-desc').hide();
        
        this.$youWin.child('.prize-code').update('<span class="code-label">CODE: </span>'+prize.code);
        
        var message = this.$youWin.child('.message'),
            bd = this.$youWin.child('.bd'),
            ft = this.$youWin.child('.ft')
            ;
            
        if( prize.address_required ){
            
            if(!this.app.addressForm ){
                var f = {
                    ship_name       :'Ship-to Name',
                    address1        :'Address',
                    address2        :'Apt / Suite',
                    city            :'City',
                    state           :'State',
                    zip             :'Zip'
                }, form=[], states = ["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"];
                
                for( var i in f ) if( f.hasOwnProperty(i) ){
                    var x='';
                    if(i=='state'){
                        var opts =[];
                        for(var j=0; j<states.length; j++) opts[opts.length] = '<option value="'+states[j]+'">'+states[j]+'</option>';
                        x='<select name="'+i+'">'+opts.join('\n')+'</select>'
                    }
                    else{
                        x='<input type="text" name="'+i+'" />';
                    }
                    form[form.length] = '<label class="'+i+'">'+
                        '<span>'+x+'<em>'+f[i]+'</em></span>'+
                        '</label>';
                }
                
                this.app.addressForm = Ext.fly(document.body).insertFirst({
                    //tag         :'div',
                    cls         :'address-form-ct',
                    html        :[
                        '<div class="address-form-padding">',
                            '<div class="prize-details">',
                                '<h4><span style="font-size:.8em">'+this.lang.youWin+'</span><br /><span style="color:black;" class="prize-name"></span></h4>',
                            '</div>',
                            '<form>',
                                '<p class="address-message"></p>',
                                '<div class="address-form">',
                                    form.join('\n'),
                                '</div>',
                                '<div class="update-btn-ct">',
                                    '<a href="javascript:;" class="btn btn-save">Update</a>',
                                '</div>',
                            '</form>',
                        '</div>'
                    ].join('\n')
                });
                
                this.app.addressForm.child('.address-form-padding').setStyle({width: (this.app.width-40)+'px'});
                this.app.addressForm.setVisibilityMode(Ext.Element.DISPLAY);
                this.app.addressForm.hide();
            }
            
            var msg = this.app.user.city ?
                'Please update your shipping information so we can send you your prize.' :
                'Please provide your shipping information so we can send you your prize.' ;
                
            this.app.addressForm.child('.address-message').update(msg);
            
            this.app.addressForm.child('.prize-name').update(prize.name);
            
            if(!this.app.user.ship_name) this.app.user.ship_name = this.app.user.name;
            
            for( var i in f ) this.app.addressForm.child('[name='+i+']').setValue(this.app.user[i] || '');
            
            message.update([
                '<div class="mailed-address"></div>'
            ].join(''));
            
            var self = this,
                
                updateMessage = function(){
                    if(self.app.user.city){
                        var a = ['<p>Your prize will be mailed to:</p><p>', self.app.user.ship_name, '<br />', self.app.user.address1];
                        if( self.app.user.address2 ){
                            a=a.concat([' ',self.app.user.address2]);
                        }
                        a=a.concat(['<br />',self.app.user.city,', ',self.app.user.state,' ',self.app.user.zip,'</p>']);
                        a=a.concat([
                           '<p>',
                           '<a class="btn btn-change">Update Address</a>',
                           '</p>'
                        ]);
                        message.child('.mailed-address').update(a.join(''));
                        message.child('.btn-change').on('click', showAddressForm);
                    }
                },
            
                showAddressForm = function(){
            
                    self.app.addressForm.show();
                    self.app.$ct.hide();
                    
                    var btn = self.app.addressForm.child('.btn-save'),
                        form = self.app.addressForm.child('form');
                    
                    btn.on('click', saveAddress);
                    form.on('submit', saveAddress);
                    
                    function saveAddress(e){
                        
                        e.stopEvent();
                        
                        var params = {};
                        for( var i in f ) params[i] = self.app.addressForm.child('[name='+i+']').getValue();
                        
                        for( var i in params ){
                            if(/(address1|city|state|zip|ship_name)/.test(i) && !params[i] ){
                                alert( f[i]+' is required.' );
                                return;
                            }
                            if('zip'==i && !/^\d{5}/.test(params[i]) ){
                                alert( f[i]+' is invalid.' );
                                return;
                            }
                        }
                        btn.update('Updating...');
                        self.app.api.call( {
                            path: self.app.entry_point.links.user,
                            method: 'post',
                            params: params
                        }, function(result){
                            btn.update('Update');
                            if(!result.data.success){
                                alert('An unexpected error occurred. Please try saving again.');
                                return;
                            }
                            
                            self.app.setUser(result.data.user);
                            updateMessage();
                            
                            self.app.addressForm.hide();
                            self.app.$ct.show();
                            self.$youWin.child('.bd').superScroll().update();
                            btn.un('click', saveAddress, self);
                            form.un('submit', saveAddress);
                            self.app.scrollToTop();
                        });
                        
                    }
                
                };
            
            if( !this.app.user.city ) showAddressForm();
            else updateMessage();
            
        }
        else if( prize.is_pdf || prize.is_email || this.app.email_only ){
            message.update([
                String.format(this.lang.sentEmail, this.app.user.email),
                '<p class="email-link"><a href="javascript:;">Change Email Address?</a></p>',
                '<div class="email-form">',
                    '<div><input class="email-field" placeholder="Enter your email" name="email" /></div>',
                    '<div class="buttons"><a href="javascript:;" class="btn btn-cancel">Cancel</a><a href="javascript:;" class="btn btn-change">Change</a></div>',
                '</div>'
            ].join('\n'));
            
            var linkBlock = message.child('.email-link'),
                changeBlock = message.child('.email-form')
                ;
                
            linkBlock.setVisibilityMode(Ext.Element.DISPLAY);
            changeBlock.setVisibilityMode(Ext.Element.DISPLAY);
            
            changeBlock.hide();
            
            changeBlock.child('input').dom.value = this.app.user.email;
                
            linkBlock.child('a').on('click', function(e){
                e.stopEvent();
                linkBlock.hide();
                changeBlock.show();
                // add new stuff...
                bd.superScroll().update();
            }, this);
            
            var changeBtn = changeBlock.child('.btn-change');
            var cancelBtn = changeBlock.child('.btn-cancel')
            
            var changing = false;
            
            changeBtn.on('click', function(e){
                e.stopEvent();
                if( changing ) return;
                // need to update the user
                changing = true;
                cancelBtn.setStyle('opacity', .6);
                changeBtn.setStyle('opacity', .6).update('Saving...');
                var self = this,
                    email= changeBlock.child('input').dom.value;
                this.app.api.call( {
                    path: this.app.entry_point.links.user,
                    method: 'post',
                    params: {
                        email: email
                    }
                }, function(result){
                    if( !result.data.success ){
                        alert( result.data.message );
                        changing = false;
                        cancelBtn.setStyle('opacity',1);
                        changeBtn.setStyle('opacity',1).update('Change');
                        return;
                    }
                    self.app.user.email = email;
                    // need to resend
                    self.app.api.call({
                        path: prize.links.resend,
                        method: 'post'
                    }, function(result){
                        changing = false;
                        bd.child('.user-email').update(changeBlock.child('input').dom.value);
                        cancelBtn.setStyle('opacity',1);
                        changeBtn.setStyle('opacity',1).update('Change');
                        changeBlock.hide();
                        linkBlock.show();
                        bd.superScroll().update();
                    });
                    
                });
            }, this);
            
            cancelBtn.on('click', function(e){
                e.stopEvent();
                if( changing ) return;
                changeBlock.child('input').dom.value = this.app.user.email;
                changeBlock.hide();
                linkBlock.show();
                bd.superScroll().update();
            }, this);
        }
        else if( prize.is_barcode ){
            
        }
        else{
            
            switch( prize.state ){
                
                case 'active':
                    var i1 = prize.wrapper_message.indexOf(':'),
                        i2 = prize.wrapper_message.indexOf('This prize expires');
                    var parts = [prize.wrapper_message.substr(0, i1)];
                    parts.push('<b>'+prize.wrapper_message.substr(i1,i2-i1)+'</b><br /><br />');
                    parts.push('<div class="expires">'+(prize.wrapper_message.substr(i2).replace(/This prize expires/i, '<span class="label">Expires:</span>'))+'</div>');
                    message.update(parts.join(''));
                    break;
                
                case 'redeemed':
                    var time = Bozuko.util.ISODate.convert(prize.redeemed_timestamp);
                    message.update("This prize was redeemed "+(time.format('fullDate'))+' at '+(time.format('shortTime'))+'.');
                    break;
                
                case 'expired':
                    var time = Bozuko.util.ISODate.convert(prize.expiration_timestamp);
                    message.update("This prize expired "+(time.format('fullDate'))+' at '+(time.format('shortTime'))+'.');
                    break;
            }
            
        }
        // add footer buttons...
        if( !(prize.address_required || prize.is_pdf || prize.is_email || this.app.email_only ) && prize.state == 'active' ){
            this.addYouWinFooterButtons({text:'Save',cls:'btn-save'},{text:'Redeem', cls:'btn-redeem'});
        }
        else if( prize.is_screen ){
            this.addYouWinFooterButtons({text:'OK',cls:'btn-save'},{text:'View', cls:'btn-open'});
        }
        else{
            this.addYouWinFooterButtons({text:'OK',cls:'btn-close'});
        }
        
        this.$youWin.child('.bd').superScroll().update();
        return this.$youWin;
    },
    
    addYouWinFooterButtons : function(){
        var buttons = this.getYouWinScreen().child('.ft .buttons');
        
        buttons.update('');
        if( !arguments.length ) return;
        var c = arguments.length,
            i, cfg,
            o = [];
        
        buttons.dom.className = 'buttons';
        buttons.addClass('buttons-'+c);
            
        for(i=0; i<arguments.length; i++){
            cfg = arguments[i];
            o.push('<div class="button-wrap"><a class="btn btn-'+(i+1)+' '+cfg.cls+'" href="#">'+cfg.text+'</a></div>');
        }
        buttons.update(o.join(''));
    },
    
    onYouWinButtonClick : function(e){
        
        // whats the target, an <a> tag?
        var btn = e.getTarget('a.btn');
        if( !btn || Ext.fly(btn).hasClass('btn-disabled') ) return;
        
        var self = this,
            yw = this.getYouWinScreen(),
            bd = yw.child('.bd'),
            ft = yw.child('.ft'),
            body = bd.child('.body'),
            redemption = bd.child('.redemption'),
            screen = bd.child('.prize-screen'),
            time = redemption.child('.time'),
            screenTime = screen.child('.time'),
            prize = yw.prize;
        
        btn = Ext.get(btn);
        if( !prize.shared && prize.links.share ){
            // get the share button
            if( yw.child('input[name=share]').dom.checked ){
                
                // yeah... lets share this bad larry.
                this.app.api.call({
                    path: prize.links.share,
                    params: {
                        message: ''
                    },
                    method: 'post'
                },function(result){
                    prize.shared = true;
                    self.updatePrizes();
                    // i don't think we really need to do anything here...
                });
                yw.addClass('prize-shared');
                bd.superScroll().update();
            }
        }
        // yw.child('textarea[name=message]').dom.value = '';
        
        if( btn.hasClass('btn-save') ){
            this.closeYouWin();
        }
        else if( btn.hasClass('btn-redeem') && !prize.redeemed ){
            if( !confirm('Please make sure you are with someone qualified to review the prize screen.') ) return;
            yw.select('.btn').addClass('btn-disabled');
            var params = {};
            self.app.useDefaultLoader();
            self.app.showLoading();
            self.app.api.call({
                path: prize.links.redeem,
                method: 'post'
            }, function(response){
                self.app.hideLoading();
                self.app.showModal( yw );
                if( !response.ok ){
                    yw.select('.btn').removeClass('btn-disabled');
                    // not good
                    return;
                }
                for( var i in response.data.prize ){
                    prize[i] = response.data.prize[i];
                    // get the security image
                }
                body.setStyle({display: 'none'});
                redemption.setStyle({display:'block'});
                redemption.child('.image').update('');
                redemption.child('.image').createChild({
                    tag         :'img',
                    src         :response.data.security_image
                });
                var redeem_time = Date.now(), blink=0;
                // countdown time...
                var clock = function(){
                    time.update(new Date().format('hh:MM:ss TT'));
                    var elapsed = Date.now() - redeem_time;
                    if( elapsed > 1000 * 60 * 4){
                        var color = !(blink++ % 2) ? 'white' : 'red';
                        time.setStyle({color: color});
                    }
                    if( elapsed > 1000 * 60 * 5){
                        self.closeYouWin();
                    }
                    
                };
                clock();
                self._redemptionClock = setInterval(clock, 1000);
                self._redeeming = true;
                self.addYouWinFooterButtons({text:'OK', cls:'btn-close'});
                bd.superScroll().update();
            });
        }
        else if( btn.hasClass('btn-open') ){
            yw.select('.btn').addClass('btn-disabled');
            self.app.showModal( yw );
            body.setStyle({display: 'none'});
            screen.setStyle({display:'block'});
            screen.child('.code').update(prize.code);
            if( prize.hide_expiration || !prize.expiration_timestamp ){
                screen.child('.expiration').hide();
            }
            else{
                var time = Bozuko.util.ISODate.convert(prize.expiration_timestamp)
                  , expired = +time > Date.now() ? 'Expires ' : 'Expired ';
                  
                if( !+time) {
                    screen.child('.expiration').hide();
                }
                else{
                    screen.child('.expiration').update( expired+' '+ (time.format('fullDate'))+' at '+(time.format('shortTime')) )
                    screen.child('.expiration').show();
                }
            }
            screen.child('.description').update(prize.description||'');
            // countdown time...
            var clock = function(){
                screenTime.update(new Date().format('hh:MM:ss TT'));
            };
            clock();
            self._redemptionClock = setInterval(clock, 1000);
            self._screen = Date.now();
            self.addYouWinFooterButtons({text:'OK', cls:'btn-close'});
            bd.superScroll().update();
        }
            
        else{
            if( this._screen && Date.now() - this._screen < 1000 ) return;
            this.closeYouWin();
        }
    },
    
    closeYouWin : function(){
        this._showingYouWin = false;
        if( this._redeeming ){
            clearInterval( this._redemptionClock );
            this.getYouWinScreen().child('.bd .body').setStyle({'display':'block'});
            this.getYouWinScreen().child('.bd .redemption').setStyle({'display':'none'});
            this._redeeming = false;
        }
        if( this._screen ){
            this.getYouWinScreen().child('.bd .body').setStyle({'display':'block'});
            this.getYouWinScreen().child('.bd .prize-screen').setStyle({'display':'none'});
            clearInterval( this._clock );
            this._screen = false;
        }
        switch( this._youWinReturn ){
            
            case 'game':
                this.app.unmask();
                this.next();
                break;
            
            default:
                this.showMyPrizes();
                break;
        }
    },
    
    showMyPrizes : function(){
        this.updateMyPrizesScreen();
        this.app.showModal(this.getMyPrizesScreen());
    },
    
    updateMyPrizesScreen : function(){
        var self = this,
            win = this.getMyPrizesScreen(),
            list = win.child('.prize-list');
            
        list.update('');
        var ul = list.createChild({tag:'ul'});
        Ext.each( this.prizes, function(prize, i){
            var win_time = Bozuko.util.ISODate.convert(prize.win_time);
            
            var li = ul.createChild({
                tag         :'li',
                cls         :'active',//prize.state,
                cn:[{
                    cls         :'prize-body',
                    cn          :[{
                        cls         :'left',
                        cn          :[/*{
                            cls         :'state',
                            html        :prize.state
                        },*/{
                            cls         :'name',
                            cn          :[{
                                tag         :'span',
                                html        :prize.name
                            }]
                        },{
                            cls         :'meta',
                            cn          :[{
                                tag         :'span',
                                html        :'Won: '+win_time.format("mediumDate")
                            }]
                        }]
                    },{
                        cls         :'right link'
                    }]
                }]
            });
            self.app.fireEvent('filter_prize', li, self );
            li.child('.link').on('click', function(){
                self._youWinReturn = 'prizes';
                self.showYouWin(self.prizes[i]);
            });
        });
        
        this.app.fireEvent('filter_prize_list', ul, self );
        
    },
    
    getMyPrizesScreen : function(){
        if( !this.$myPrizes ){
            this.$myPrizes = this.app.createModal({
                cls             :'my-prizes page-window modal-window-full',
                cn              :[{
                    cls             :'top-bar',
                    html            :'<a href="javascript:;" class="back-to-game">&larr; '+this.lang.backToGame+'</a>'
                },{
                    cls             :'hd',
                    cn              :[{
                        cls             :'page-pic'
                    },{
                        cls             :'content',
                        cn              :[{
                            tag             :'h3',
                            html            :this.lang.myPrizes
                        }]
                    }]
                },{
                    cls             :'bd',
                    cn              :[{
                        cls             :'scrollable prize-list'
                    }]
                }]
            });
            
            this.app.fireEvent('filter_my_prizes', this.$myPrizes, this );
            
            this.$myPrizes.child('.back-to-game').on('click', this.showDescription, this);
            this.squareImage(this.$myPrizes.child('.page-pic'), this.app.user.image);
            var show = this.$myPrizes.show;
            var self = this;
            this.$myPrizes.show = function(){
                show.apply(this, arguments);
                var bd = self.$myPrizes.child('.bd');
                //bd.setHeight( self.$description.getHeight(true) - (bd.getXY()[1]-self.$description.getXY()[1]) );
                self.$myPrizes.child('.bd').superScroll({
                    horizontal : false,
                    fixSize : function(){
                        bd.setHeight( self.$myPrizes.getHeight(true)+4 - (bd.getXY()[1]-self.$myPrizes.getXY()[1]) );
                    }
                });
            };
        }
        return this.$myPrizes;
    },
    
    onAfterWin : function(){
        var self = this;
        self.showYouWin(self.game_result.prize);
        self._youWinReturn = 'game';
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
        var img = new Image(),
            // get dimensions now in case the element is hidden
            cw = el.getWidth(),
            ch = el.getHeight();
            
        img.onload = function(){
            var $img = Ext.fly(img),
                w = img.width,
                h = img.height;
                
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
                
                if( !result.ok ){
                    self.showDescription();
                    self.updateActionFromState();
                    return;
                }
                
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
        
        if( self.game.entry_method.use_location ){
            // we should get the location
            var loc_entry = function(){
                navigator.geolocation.getCurrentPosition(function(position){
                    return do_entry(position.coords.latitude, position.coords.longitude, position.coords.accuracy);
                }, function(){
                    return do_entry(0,0,0);
                });
            }
            if( self.game.entry_method.type.match(/checkin/) ){
                return FB.api('/me/permissions', function (response){
                    if( !response.data[0].publish_checkins ){
                        // we need to shoot these people to login
                        return window.top.location = '/client/login?redirect='+encodeURIComponent(window.location.pathname);
                    }
                    else return loc_entry();
                });
            }
            return loc_entry();
        }
        else{
            return do_entry(0,0,0);
        }
    },
    
    result : function(callback){
        
        var self = this;
        this.fireEvent('beforeresult');
        
        self.app.api.call({
            path: self.state.links.game_result,
            method: 'post'
        },function(result){
            
            self.fireEvent('afterresult');
            
            if( !result.ok ){
                self.updateActionFromState();
                self.showDescription();
                return;
            }
            if( result.data.win ){
                self.updatePrizes();
            }
            
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
        if( !state ) { return ; }
        var self = this;
        if( this._updateTimeout ) clearTimeout(this._updateTimeout);
        this.state = state;
        if( state.next_enter_time_ms && state.next_enter_time_ms > 0 ){
            // set a timeout
            this._updateTimeout = setTimeout( function(){
                self.updateState();
            }, state.next_enter_time_ms );
        }
        this.fireEvent('statechange', state);
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