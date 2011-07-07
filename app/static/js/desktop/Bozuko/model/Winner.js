Ext.define('Bozuko.model.Winner', {
    
    extend: 'Ext.data.Model',
    
    idProperty: '_id',
    
    requires: [
        'Bozuko.lib.Router'
    ],
    
    proxy: {
        type: 'rest',
        url: '/winners',
        reader: {
            type: 'json',
            root: 'items'
        }
    },
    
    fields: [
        {name:'_id',                type:'String'},
        {name:'contest_id',         type:'String'},
        {name:'prize',              type:'Object'},
        {name:'contest',            type:'Object'},
        {name:'page',               type:'Object'},
        {name:'user',               type:'Object'}
    ]
}, function(){
    this.prototype.proxy.url = Bozuko.Router.route(this.prototype.proxy.url);
});