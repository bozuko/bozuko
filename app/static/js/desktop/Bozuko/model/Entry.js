Ext.define('Bozuko.model.Entry', {
    
    extend: 'Ext.data.Model',
    
    idProperty: '_id',
    
    requires: [
        'Bozuko.lib.Router'
    ],
    
    proxy: {
        type: 'rest',
        url: '/entries',
        reader: {
            type: 'json',
            root: 'items',
            totalProperty: 'total'
        }
    },
    
    fields: [
        {name:'_id',                type:'String'},
        {name:'type',               type:'String'},
        {name:'tokens',             type:'Number'},
        {name:'timestamp',          type:'Date'},
        {name:'contest',            type:'Object'},
        {name:'page',               type:'Object'},
        {name:'user',               type:'Object'}
    ],
    
    getEntryType : function(){
        var me = this,
            type;
            
        try{
            switch( me.get('type') ){
                
                case 'bozuko/checkin':
                    type = 'Bozuko Checkin';
                    break;
                
                case 'bozuko/nothing':
                    type = 'Bozuko Play';
                    break;
                
                case 'facebook/like':
                    type = 'Facebook Like';
                    break;
                
                case 'facebook/checkin':
                    type = 'Facebook Checkin';
                    break;
                    
                default:
                    throw e;
                
            }
        }catch(e){
            type = 'Unknown';
        }
        return type;
    }
    
}, function(){
    this.prototype.proxy.url = Bozuko.Router.route(this.prototype.proxy.url);
});