Ext.namespace('Bozuko.client');

Bozuko.client.App = Ext.extend( Ext.util.Observable, {
    
    dimensions : {x: 320, y: 415},
    
    constructor : function(config){
        var self = this;
        
        this.user = null;
        this.userState = 'loading';
        this.stopped = false;
        this.currentView = 'start';
        this._loading = false;
        
        this.config = config || {};
        Ext.apply( this, config );
        
        this.ct = this.config.renderTo || document.body;
        this.$ct = Ext.get(this.ct);
        this.$ct.setVisibilityMode(Ext.Element.DISPLAY);
        
        this.api = new Bozuko.client.lib.Api();
        this.api.on('failure', function(result){
            if( result.data && result.data.message ){
                alert(result.data.message);
                if( self.game ) self.game.updateActionFromState();
            }
        });
        
        this.createElements();
        
        
        // scroll the window to the top
        setTimeout(function(){
            self.scrollToTop();
        }, 300);
        
        this.addEvents({
            'pagedata'      :true,
            'user'          :true,
            'nouser'        :true,
            'logout'        :true
        });
        
        Bozuko.client.App.superclass.constructor.call(this, config);
        Bozuko.client.App.Events.fireEvent('construct', this, config);
        
        this.showLoading('Loading...');
        
        this.on('pagedata', function(data){
            self.updateBranding();
        });
        if( !this.validPath() ){
            return;
        }
        if( config.facebook_tab ){
            this.width = 420;
        }
        else {
            this.width = Math.min( 520, Math.max( this.config.width || Math.min(window.innerWidth||document.documentElement.clientWidth, window.innerHeight||document.documentElement.clientHeight), 320 ) );
        }
        this.height = this.width/this.dimensions.x*this.dimensions.y;
        this.stylesheet = Bozuko.client.util.Stylesheet.create('app');
        
        this.stylesheet.rule('.modal-window', {
            'max-height': (this.height-30-6)+'px'
        });
        this.stylesheet.rule('.modal-window-full', {
            'min-height': (this.height-30-6)+'px'
        });
        if( Modernizr.touch && !window.navigator.userAgent.match(/i(pad|pod|phone)/i) ) this.stylesheet.rule('body',{
            'width': this.width+'px'
        });
        
        function centerGame(){
            var h =  self.windowHeight||window.innerHeight||document.documentElement.clientHeight;
            self.stylesheet.rule('body', {
                'min-height': h+'px'
            });
            if( h > self.height ){
                var padding = (h - self.height) / 2;
                self.stylesheet.rule('body', {
                    'min-height': (h-padding)+'px'
                });
                Ext.fly(self.ct).setStyle({
                    'padding-top': padding+'px',
                    'padding-bottom': padding+'px'
                    
                });
            }
            self.scrollToTop();
        }
        
        // scale the page
        Ext.get(document.body).setStyle('font-size', 13*this.width/this.dimensions.x+'px');
        Ext.get(this.ct).setWidth(this.width);
        
        
        this.startFromPath();
        this.initFacebook();
        
        if( config.facebook_tab ){
            FB.Canvas.setSize({height:this.height + 100});
            self.windowHeight = this.height+100;
            setTimeout(centerGame, 200);
        }
        else setTimeout(centerGame, 200);
        
        this.on('user', function(){
            this.userState = 'user';
        }, this);
        
        this.on('nouser', function(){
            this.userState = 'nouser';
        });
        
    },
    
    createElements : function(){
        try{
            // hack to fix mac / chrome
            var gpuCanvas = document.createElement('canvas');
                gpuCanvas.width = gpuCanvas.height = 1;
                gpuCanvas.getContext("experimental-webgl");
                
            gpuCanvas.style.position='absolute';
            gpuCanvas.style.top='-100px';
            gpuCanvas.style.left='-100px';
            document.body.appendChild( gpuCanvas );
        }catch(e){}
        
        this.$body = Ext.get(this.ct).createChild({
            cls         :'app'
        });
        
        if( this.facebook_tab ){
            this.$poweredBy = Ext.get(this.ct).createChild({
                cls         :'bozuko-powered',
                style       :'display: none',
                tag         :'a',
                target      :'_blank',
                href        :'https://bozuko.com'
            });
        }
        
        this.$mask = this.$body.createChild({
            cls         :'mask'
        });
        
        this.$mask.on('click', function(e){
            e.stopEvent();
        });
        
        this.$modal = this.$body.createChild({
            cls         :'modal'
        });
        
        this.$loading = this.createModal({
            cls         :'loading-mask',
            cn: [{
                cls         :'bg',
                cn          :[{
                    tag         :'img',
                    cls         :'spinner',
                    src         :'/images/client/loading.gif?v2'
                }]
            }]
        });
        
        if( Modernizr.cssanimations ){
            var img = this.$loading.child('img');
            img.dom.src = '/images/client/spinner2.png?v2';
            img.addClass('animated-spinner');
        }
        
        var defaultLoader = new Bozuko.client.Loader(this.$loading);
        
        defaultLoader.on('showloading', function(){
            this.showModal(defaultLoader.$el);
        }, this);
        
        defaultLoader.on('hideloading', function(){
            this.hideModal();
        }, this);
        
        
        this._defaultLoader = defaultLoader;
        this.useDefaultLoader();
        
        this.$message = this.createModal({
            cls         :'message',
            cn: [{
                tag         :'p',
                cn          :[{
                    tag         :'span',
                    cls         :'text',
                    html        :''
                }]
            }]
        });
    },
    
    useDefaultLoader : function(){
        this.registerLoader( this._defaultLoader );
    },
    
    createModal : function(config){
        if( config.cls ) config.cls+=' modal-window';
        else config.cls = 'modal-window';
        var el = this.$modal.createChild(config);
        el.setVisibilityMode(Ext.Element.DISPLAY);
        return el;
    },
    
    initFacebook : function(){
        var self = this;
        var channel = '//'+(window.location.hostname+((~['',null,80,443].indexOf(window.location.port))?'':(':'+window.location.port))+'/channel.html');
        try{
            FB.init({
                appId: Bozuko.client.App.facebookApp.id,
                status: true, 
                cookie: true,
                oauth: true,
                channelUrl: channel
            });
            
            FB.Canvas.setSize({height:this.height + 100});
            
            FB.Event.subscribe('auth.logout', function(){
                self.fireEvent('nouser');
            });
            FB.Event.subscribe('auth.login', function(response){                
                self.onFacebookLogin(response);
            });
        }catch(e){
            if( e.code === DOMException.QUOTA_EXCEEDED_ERR ){
                // this is probably safari in private browsing mode
                alert('This page will not work in private browsing mode. Please go to Settings > Safari and make sure "Private Browsing" is set to "off". Thanks!');
            }
        }
    },
    
    logout : function(){
        this.user = false;
        this.userState = 'nouser';
        this.fireEvent('nouser');
        Bozuko.client.util.Cache.clear();
        this.api.setToken(false);
        FB.logout();
        this.fireEvent('logout');
        this.showLogin();
    },
    
    doFacebookLogin : function(){
        var self = this;
        
        self.showLoading('Contacting Facebook...');
        FB.getLoginStatus(function(response){
            self.onFacebookLogin(response);
        });
    },
    
    onFacebookLogin : function(response){
        var self = this;
        if( !response.authResponse ){
            self.fireEvent('nouser');
            self.showLogin();
        }
        else{
            // now we need to get the user
            self.bozukoLogin(response.authResponse.accessToken, function(error, user){
                if( self.stopped ) return false;
                if( error || !user || user.success === false){
                    return self.showLogin();
                }
                return self.onUserConnected();
            });
        }
    },
    
    onUserConnected : function(){
        var self = this;
        if( this.currentView !== 'game' ){
            self.showMessage("Unsupported Path");
            return;
        }
        if( !this.game ){
            self.showMessage("Loading Game...");
            return;
        }
        self.showLoading('Loading Game...');
        self.game.load(self.user);
    },
    
    bozukoLogin : function(token, callback){
        var self = this;
        
        Ext.Ajax.request({
            method: 'POST',
            url: '/client/fblogin?'+(new Date().getTime()),
            params: {token: token},
            success : function(response, request){
                try{
                    var user = Ext.decode(response.responseText);
                    if( user ){
                        self.setUser(user);
                        return self.api.call(function(entry_point){
                            self.entry_point = entry_point.data;
                            self.fireEvent('user');
                            return callback(null, user);
                        });
                    }
                }
                catch(e){
                    console.log(e);
                }
                self.fireEvent('nouser');
                return callback(new Error('No User'));
            },
            failure : function(response, request){
                self.fireEvent('nouser');
                return callback(new Error('No User'));
            }
        });
    },
    
    showLogin : function(){
        this.showLoading(
            'Please login with Facebook to play <a href="#" class="facebook-login">Login With Facebook</a>'
        );
        var self = this;
        this._loader.$el.child('.facebook-login').dom.onclick = function(){
            // test for qr reader on iphone...
            var qr = navigator.userAgent.match(/i(phone|pad|pod)/i );
            if( !qr ){
                FB.login(function(){
                    
                },{scope: Bozuko.client.App.facebookApp.scope});
                self.showLoading('Logging in...');
            }
            else{
                window.top.location = '/client/login?redirect='+encodeURIComponent(window.location.pathname);
            }
        };
    },
    
    getBrandingElements : function(){
        if( !this.page ) return [];
        return [{
            tag         :'table',
            style       :'margin: 0 auto',
            cn          :[{
                tag         :'tr',
                valign      :'middle',
                cn          :[{
                    tag         :'td',
                    cn          :[{
                        tag         :'img',
                        src         :this.page.image.replace('type=large', 'type=square'),
                        style       :'height: 50px; width: 50px; margin-right: 10px; vertical-align: middle;'
                    }]
                },{
                    tag         :'td',
                    cn          :[{
                        tag         :'h4',
                        html        :this.page.name
                    }]
                }]
            }]
        }]
    },
    
    updateBranding : function(){
        Ext.select('.branding').update('');
        Ext.select('.branding').createChild(this.getBrandingElements());
    },
    
    doLogin : function(){
        var self = this;
        // test for qr reader on iphone...
        var qr = navigator.userAgent.match(/i(phone|pad|pod)/i ) && !navigator.userAgent.match(/safari/i);
        
        if( !qr ){
            FB.login(function(){},{scope: Bozuko.client.App.facebookApp.scope});
            this.showLoading('Logging in...');
        }
        else{
            window.top.location = '/client/login?redirect='+encodeURIComponent(window.location.pathname);
        }
    },
    
    setUser : function(user){
        this.user = user;
        this.api.setToken( user.token );
    },
    
    scrollToTop : function(){
        window.scrollTo(0,1);
    },
    
    mask : function(keep){
        this.keepmask = keep;
        this.$mask.show();
        this.$modal.show();
    },
    
    unmask : function(force){
        if( this.keepmask && !force ) return;
        this.$mask.hide();
        this.$modal.hide();
    },
    
    showLoading : function(text){
        this._loading = true;
        this._loader.show(text);
    },
    
    hideLoading : function(){
        this._loading = false;
        this._loader.hide();
    },
    
    showMessage : function(text){
        this.mask();
        if(text) this.$message.select('.text').update(text);
        this.showModal(this.$message);
    },
    
    hideMessage : function(text){
        this.hideModal();
    },
    
    showModal : function($el, keep){
        if( this.stopped ) return;
        this.mask(keep);
        this.$modal.select('.modal-window').hide();
        $el.show();
        this.fireEvent('showmodal');
    },
    
    hideModal : function(force){
        this.fireEvent('hidemodal');
        this.unmask(force);
    },
    
    registerLoader : function(loader){
        var old = this._loader;
        if( old ){
            loader.setText(old.getText());
        }
        this._loader = loader;
        if( this._loading ){
            this._loader.show();
        }
    },
    
    startFromPath : function(){
        var self = this,
            path = Bozuko.client.App.path || '/';
        
        // we only know about direct game links right now...
        if( path.match( /^\/game\/.*/ ) ){
            this.currentView = 'game';
            this.openGame( path );
        }
        else{
            this.showMessage('Path Not Supported');
        }
    },
    
    validPath : function(){
        var path = Bozuko.client.App.path || '/';
        return path.match( /^\/game\/.*/ );
    },
    
    openGame : function( path ){
        var self = this,
            api = this.api;
            
        api.call( path, function(gameResponse){
            // we also need to get the page
            
            if( !gameResponse.ok ){
                // handle this error
                self.showMessage('Error retreiving game');
                self.stopped = true;
                return;
            }
            
            window.gameResponse = gameResponse;
            
            api.call( {path: gameResponse.data.links.page}, function(pageResponse){
                if( !pageResponse.ok ){
                    self.showMessage('Error retreiving page');
                    self.stopped = true;
                    return;
                }
                
                // check for the game class
                var type = gameResponse.data.type
                  , Game = Bozuko.client.game[type.substr(0,1).toUpperCase() + type.substr(1)];
                
                if( !Game ){
                    self.showMessage('Unsupported Game Type');
                    self.stopped = true;
                    return;
                }
                
                self.page = pageResponse.data;
                self.fireEvent('pagedata', pageResponse.data, self);
                
                if( !self.page.nobranding && self.$poweredBy){
                    self.$poweredBy.show();
                }
                
                self.game = new Game({
                    width: self.$body.getWidth(),
                    height: self.$body.getWidth()/320*415,
                    game: gameResponse.data,
                    page: pageResponse.data,
                    user: self.user,
                    app: self,
                    renderTo: self.$body
                });
                
                // now lets get the user
                self.doFacebookLogin();
                
            });
        });
    },
    
    cache : function(key, value){
        
        if( value === undefined ){
            return Bozuko.client.util.Cache.get(key);
        }
        if( value === false ){
            return Bozuko.client.util.Cache.del(key);
        }
        return Bozuko.client.util.Cache.set(key, value);
    }
    
});

Bozuko.client.Loader = Ext.extend( Ext.util.Observable, {
    
    constructor : function(el, config){
        this.$el = Ext.get(el);
        this.text = 'Loading...';
        Ext.apply(this, config);
        this.addEvents({
            'showloading'       :true,
            'hideloading'       :true
        });
        Bozuko.client.Loader.superclass.constructor.call(this);
    },
    
    setText : function(txt){
        this.text = txt;
        this.$el.select('.loading-text').update(txt);
        return this;
    },
    
    getText : function(){
        return this.text;
    },
    
    getEl : function(){
        return this.$el;
    },
    
    show : function(txt){
        if(txt) this.setText(txt);
        this.fireEvent('showloading', this);
        return this;
    },
    
    hide : function(){
        this.fireEvent('hideloading', this);
        return this;
    }
    
});

(function(){
    var instances = [];
    Bozuko.client.App.Events = new Ext.util.Observable();
    Bozuko.client.App.launch = function(config){
        Ext.onReady(function(){
            var inst = instances[instances.length] = new Bozuko.client.App(config);
            Bozuko.client.App.Events.fireEvent('created', inst);
        });
    };
    
    Bozuko.client.App.getInstances = function(){
        return instances;
    }
    Bozuko.client.App.getInstance = function(){
        return instances[0];
    }
})();
