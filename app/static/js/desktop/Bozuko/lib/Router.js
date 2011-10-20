Ext.define('Bozuko.lib.Router', {
    
    extend: 'Object',
    path: Bozuko.routePath || '/admin',
    
    constructor : function(){
        this.callParent(arguments);
    },
    
    setBasePath : function(path){
        if( !/^\//.test(path) ) path = '/'+path;
        this.path = path;
    },
    
    route : function(path){
        if( !/^\//.test(path) ) path = '/'+path;
        return this.path+path;
    }
    
}, function(){
    Bozuko.Router = new Bozuko.lib.Router();
});