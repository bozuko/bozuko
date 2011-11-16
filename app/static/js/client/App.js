Ext.namespace('Bozuko.client');

Bozuko.client.App = Ext.extend( Ext.util.Observable, {
    
    constructor : function(config){
        
        var self = this;
        
        this.user = null;
        
        this.config = config || {};
        Ext.apply( this, config );
        this.$body = Ext.get(document.body).createChild({
            cls: 'app',
            html: "<div style='color:#fff; font-size: 22px; text-align: center; position: absolute; top: 20%; width: 100%; left: 0;'>Loading...</div>"
        });
        
        this.$modal = this.$body.createChild({
            cls: 'modal'
        });
        
        document.body.addEventListener('touchstart', function(e){
            e.preventDefault();
        }, false);
        
        // scroll the window to the top
        setTimeout(function(){
            window.scrollTo(0,1);
        }, 200);
        
        this.api = new Bozuko.client.lib.Api();
        
        this.init();
    },
    
    init : function(){
        var self = this,
            api = this.api;
            
        //initialize facebook
        FB.init({
            appId: Bozuko.client.App.facebookApp.id, 
            status: true, 
            cookie: true,
            xfbml: true,
            oauth: true
        });
      
        FB.Event.subscribe('auth.login', function(data){
            self.onFacebookLogin(data)
        });
        FB.Event.subscribe('auth.logout', function(data){
            self.onFacebookLogout(data)
        });
        
        FB.getLoginStatus(function(response){
            self.login(function(){
                
            });
        });
        
        api.call(function(response){
            
            self.entry_point = response.data;
            
            if( !api.last().data.links.user ){
                // self.startFromPath();
            }
            else{
                api.call({path: api.last().data.links.user},function(response){
                    self.user = response.data;
                    api.setToken(self.user.token);
                    // dself.startFromPath();
                });
            }
        });
    },
    
    login : function(callback){
        var self = this;
        this.loginCallback = callback;
        
        if( !this.$loginScreen ){
            this.$loginScreen = this.$modal.createChild({
                cls: 'modal-dialog login',
                cn:[{
                    cls: 'facebook-btn',
                    tag: 'button',
                    html: 'Login'
                }]
            });
            this.$loginScreen.down('.facebook-btn').on('touchstart', function(){
                self.fbLogin();
            });
            this.$modal.show();
        }
    },
    
    fbLogin : function(){
        alert('start');
        FB.login(function(){
            alert('done');
        });
    },
    
    onFacebookLogin : function(data){
        
    },
    onFacebookLogout: function(data){
        
    },
    
    createModalWindow : function(cfg){
        var $window = this.$modal.createChild({
            cls: 'modal-window'
        });
        return $window;
    },
    
    showModalWindow : function(window){
        this.$modal.show();
    },
    
    startFromPath : function(){
        var self = this,
            path = Bozuko.client.App.path || '/';
        
        // we only know about direct game links right now...
        if( path.match( /^\/game\/.*/ ) ){
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
