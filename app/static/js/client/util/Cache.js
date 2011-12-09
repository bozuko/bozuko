Ext.ns('Bozuko.client.util.Cache');

Bozuko.client.util.Cache = (function(){
    
    var Adapter = function(cache){
        this.cache = cache;
        this.init();
    };
    
    Adapter.prototype.init = function(){
        
    };
    
    var LocalStorageAdapter = Ext.extend( Adapter, {
        
        init : function(){
            
            this.key = 'BozukoClient';
            
            this.cache.on('set', this.update, this);
            this.cache.on('del', this.update, this);
            this.cache.on('clear', this.clear, this);
            try{
                var data = window.localStorage.getItem(this.key);
                if( data ){
                    this.cache.setData( Ext.decode(data) );
                }
            }catch(e){
                // something is wrong with local storage.
            }
        },
        
        update : function(){
            
            try{
                this.clear();
                window.localStorage.setItem(this.key, Ext.encode(this.cache.getData()));
            }catch(e){
                // something wrong
            }
        },
        
        clear : function(){
            try{
                window.localStorage.removeItem(this.key);
            }catch(e){
                // something wrong with local storage
            }
        }
        
    });
    
    var CookieAdapter = Ext.extend( Adapter, {
        
        init : function(){
            
            this._prefix = '_client_';
            this._regexp = new RegExp("(?:^|;\\s*)" +this._prefix+"([^\\s\\=]*?)"+ "\\s*\\=", 'g');
            
            this.cache.on('set', this.set, this);
            this.cache.on('del', this.del, this);
            this.cache.on('clear', this.clear, this);
            
            var data = {}, keys = this.getAllKeys();
            for(var i=0; i<keys.length; i++){
                data[keys[i]] = this.get(keys[i]);
            }
            this.cache.setData(data);
        },
        
        getAllKeys : function(){
            var matches = document.cookie.match(this._regexp),
                keys = [];
            
            if( matches ) for(var i = 0; i<matches.length; i++){
                var name = matches[i].replace(/^;\s*/, '').replace(/\s*=$/,'');
                if( name.indexOf(this._prefix) === 0 ){
                    keys[keys.length] = name.substr(this._prefix.length);
                }
            }
            return keys;
        },
        
        get : function(key){
            var v = Bozuko.client.util.Cookies.get(this._prefix+key);
            try{
                return Ext.decode(v);
            }catch(e){
                return false;
            }
        },
        
        set : function(cache, key, value){
            var expiration = new Date( Date.now() + 1000*60*60*24 );
            Bozuko.client.util.Cookies.set(this._prefix+key, Ext.encode(value), expiration);
        },
        
        del : function(cache, key, value){
            Bozuko.client.util.Cookies.clear(this._prefix+key);
        },
        
        clear : function(cache){
            // need to delete all cookies...
            var keys = this.getAllKeys();
            for(var i=0; i<keys.length; i++){
                this.del(keys[i]);
            }
        }
    });
    
    var Cache = Ext.extend(Ext.util.Observable, {
        
        constructor : function(){
            
            this._data = {};
            this.addEvents({
                'set'       :true,
                'get'       :true,
                'del'       :true,
                'clear'     :true
            });
            
            Cache.superclass.constructor.call(this);
            
            
            if(0) this._adapter = window.localStorage ?
                new LocalStorageAdapter(this) :
                new CookieAdapter(this);
        },
        
        
        getData : function(){
            return this._data;
        },
        
        setData : function(data){
            this._data = data;
        },
        
        set : function(key, value){
            this._data[key] = value;
            this.fireEvent('set', this, key, value, this._data);
        },
        
        get : function(key){
            return this._data[key];
        },
        
        del : function(key){
            delete this._data[key];
            this.fireEvent('del', this, key, this._data);
        },
        
        clear : function(){
            this._data = {};
            this.fireEvent('clear', this, this._data);
        }
        
    });
    
    return new Cache();
})();