Ext.namespace('Bozuko.client');

Ext.Element.prototype.update = function(html){
    this.dom.innerHTML = html;
};

Bozuko.client.App = Ext.extend( Ext.util.Observable, {
    
    constructor : function(config){
        
        var self = this;
        
        this.user = null;
        this.stopped = false;
        this.currentView = 'start';
        this._loading = false;
        
        this.config = config || {};
        Ext.apply( this, config );
        
        this.api = new Bozuko.client.lib.Api();
        
        this.createElements();
        this.showLoading('Loading...');
        
        Ext.get(document.body).on('touchstart', function(e){
            //e.preventDefault();
        }, false);
        
        // scroll the window to the top
        setTimeout(function(){
            self.scrollToTop();
        }, 200);
        
        this.addEvents({
            'pagedata' : true
        });
        
        Bozuko.client.App.superclass.constructor.call(this, config);
        
        this.on('pagedata', function(data){
            this.updateBranding();
        });
        if( !this.validPath() ){
            return;
        }
        this.initFacebook();
        this.startFromPath();
        
    },
    
    createElements : function(){
        
        this.$body = Ext.get(document.body).createChild({
            cls         :'app'
        });
        
        this.$mask = this.$body.createChild({
            cls         :'mask'
        });
        
        this.$modal = this.$body.createChild({
            cls         :'modal'
        });
        
        this.$loading = this.createModal({
            cls         :'loading',
            cn: [{
                cls         :'branding',
                cn          :this.getBrandingElements()
            },{
                tag         :'p',
                cn          :[{
                    tag         :'span',
                    cls         :'text',
                    html        :'Loading...'
                }]
            },{
                cls         :'powered-by',
                cn          :[{
                    tag         :'span',
                    cls         :'small',
                    html        :'Powered By'
                }]
            }]
        });
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
        
        //initialize facebook
        FB.init({
            appId: Bozuko.client.App.facebookApp.id, 
            status: true, 
            cookie: true,
            xfbml: true,
            oauth: true
        });
    },
    
    doFacebookLogin : function(){
        var self = this;
        
        self.showLoading('Contacting Facebook...');
        FB.getLoginStatus(function(response){
            // check status
            if( !response.authResponse ){
                self.showLogin();
            }
            else{
                // now we need to get the user
                self.bozukoLogin(response.authResponse.accessToken, function(error, user){
                    if( self.stopped ) return false;
                    if( error || !user || user.success === false){
                        //return self.showLogin();
                    }
                    return self.onUserConnected();
                });
            }
        });
    },
    
    onUserConnected : function(){
        var self = this;
        if( this.currentView !== 'game' ){
            self.showMessage("Unsupported Path");
            return;
        }
        if( !this.scratch ){
            self.showMessage("Unsupported Game Type");
            return;
        }
        
        self.showLoading('Loading Game...');
        self.scratch.load();
    },
    
    bozukoLogin : function(token, callback){
        var self = this;
        
        Ext.Ajax.request({
            method: 'POST',
            url: '/client/fblogin',
            params: {token: token},
            success : function(response, request){
                try{
                    var user = Ext.decode(response.responseText);
                    if( user ){
                        self.setUser(user);
                        return callback(null, user);
                    }
                }
                catch(e){
                    console.log(e.stack);
                }
                return callback(new Error('No User'));
            },
            failure : function(response, request){
                return callback(new Error('No User'));
            }
        });
    },
    
    showLogin : function(){
        this.showLoading(
            'Please login with Facebook to play <a href="#" class="facebook-login">Login With Facebook</a>'
        );
        this._loader.$el.child('.facebook-login').on('click', function(){
            this.doLogin();
        }, this);
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
        /**
         * FB.login or redirect ?
         *
         * We want to do the FB.login for desktop situations...
         * 
         */
        
        if( window.location != window.parent.location ){
            FB.login(function(response){
                // now we need to get the user
                self.bozukoLogin(response.authResponse.accessToken, function(error, user){
                    if( self.stopped ) return false;
                    if( error || !user || user.success === false){
                        //return self.showLogin();
                    }
                    return self.onUserConnected();
                });
            },{scope: Bozuko.client.App.facebookApp.scope});
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
    
    mask : function(){
        this.$mask.show();
        this.$modal.show();
    },
    
    unmask : function(){
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
    
    showModal : function($el){
        if( this.stopped ) return;
        this.mask();
        this.$modal.select('.modal-window').hide();
        $el.show();
    },
    
    hideModal : function(){
        this.unmask();
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
            api.call( {path: gameResponse.data.links.page}, function(pageResponse){
                if( !pageResponse.ok ){
                    self.showMessage('Error retreiving page');
                    self.stopped = true;
                    return;
                }
                
                if( !gameResponse.data.type == 'scratch' ){
                    self.showMessage('Unsupported Game Type');
                    self.stopped = true;
                    return;
                }
                
                self.page = pageResponse.data;
                self.fireEvent('pagedata', pageResponse.data, self);
                
                self.scratch = new Bozuko.client.game.Scratch({
                    game: gameResponse.data,
                    page: pageResponse.data,
                    user: self.user,
                    app: self,
                    renderTo: self.$body
                });
                
                // now lets get the user?
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
    Bozuko.client.App.launch = function(config){
        Ext.onReady(function(){
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
