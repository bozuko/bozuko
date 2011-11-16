Ext.namespace('Bozuko.client');

Ext.Element.prototype.update = function(html){
    this.dom.innerHTML = html;
};


Bozuko.client.App = Ext.extend( Ext.util.Observable, {
    
    constructor : function(config){
        
        var self = this;
        
        this.user = null;
        this.currentView = 'start';
        
        this.config = config || {};
        Ext.apply( this, config );
        
        this.api = new Bozuko.client.lib.Api();
        
        this.createElements();
        this.showLoading('Loading...');
        
        document.body.addEventListener('touchstart', function(e){
            e.preventDefault();
        }, false);
        
        // scroll the window to the top
        setTimeout(function(){
            self.scrollToTop();
        }, 200);
        
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
        
        this.$loading = this.$modal.createChild({
            cls         :'modal-window loading',
            cn: [{
                cls         :'logo'
            },{
                tag         :'p',
                cls         :'text',
                html        :'Loading...'
            }]
        });
        this.$loading.setVisibilityMode(Ext.Element.DISPLAY);
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
        
        FB.getLoginStatus(function(response){
            // check status
            if( !response.authResponse ){
                self.showLogin();
            }
            else{
                // now we need to get the user
                self.showLoading('Logging you in...');
                self.bozukoLogin(response.authResponse.accessToken, function(error, user){
                    if( error ) return console.log(error.stack);
                    if( !user ){
                        // show login button...
                        return self.showLogin();
                    }
                    // TODO - show who you are logged in as...
                    return self.onUserConnected();
                    
                });
            }
        });
    },
    
    onUserConnected : function(){
        var self = this;
        if( this.currentView !== 'game' ){
            alert("Error");
            return;
        }
        if( !this.scratch ){
            alert("Unsupported Game Type");
            return;
        }
        self.showLoading('Loading Game...');
        self.scratch.load(function(error, loaded){
            self.unmask();
        });
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
        this.mask();
        if(text) this.$loading.down('.text').update(text);
        this.showModal(this.$loading);
    },
    
    hideLoading : function(){
        this.hideModal();
    },
    
    showModal : function($el){
        this.mask();
        this.$modal.select('.modal-window').hide();
        $el.show();
    },
    
    hideModal : function(){
        this.unmask();
    },
    
    showLogin : function(){
        if( !this.$loginWindow ){
            this.$loginWindow = this.$modal.createChild({
                cls         :'modal-window loading',
                cn: [{
                    cls         :'logo'
                },{
                    cls         :'text',
                    cn          :[{
                        tag         :'p',
                        html        :'Welcome to Bozuko! You must login with Facebook to play.'
                    },{
                        tag         :'a',
                        cls         :'facebook-login',
                        href        :'#;',
                        html        :'Login With Facebook'
                    }]
                }]
            });
            
            this.$loginWindow.child('.facebook-login').on({
                scope: this,
                'touchstart' : this.doLogin,
                'click' : this.doLogin
            });
            
            this.$loginWindow.setVisibilityMode( Ext.Element.DISPLAY );
        }
        this.showModal(this.$loginWindow);
    },
    
    doLogin : function(){
        var self = this;
        // facebook or regular...
        window.location.href = '/client/login?redirect='+encodeURIComponent(window.location.pathname);
    },
    
    createModalWindow : function(cfg){
        var $window = this.$modal.createChild({
            cls: 'modal-window'
        });
        return $window;
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
            alert('Path Not Supported');
        }
    },
    
    openGame : function( path ){
        var self = this,
            api = this.api;
            
        api.call( path, function(gameResponse){
            // we also need to get the page
            if( !gameResponse.ok ){
                // handle this error
                alert('Error retreiving game');
                return;
            }
            api.call( {path: gameResponse.data.links.page}, function(pageResponse){
                if( !pageResponse.ok ){
                    alert('Error retreiving page');
                    return;
                }
                
                if( !gameResponse.data.type == 'scratch' ){
                    alert('Unsupported Game Type');
                    return;
                }
                
                self.scratch = new Bozuko.client.game.Scratch({
                    game: gameResponse.data,
                    page: pageResponse.data,
                    user: self.user,
                    app: self,
                    renderTo: self.$body
                });
                
            });
        });
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
