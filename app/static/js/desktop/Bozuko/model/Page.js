Ext.define('Bozuko.model.Page', {
    extend: 'Bozuko.lib.data.Model',
    
    idProperty: '_id',
    
    proxy: {
        type: 'rest',
        url: '/pages',
        reader: {
            type: 'json',
            root: 'items'
        }
    },
    
    fields: [
        {name:'_id',            type:'String'},
        {name:'name',           type:'String'},
        {name:'category',       type:'String'},
        {name:'website',        type:'String'},
        {name:'image',          type:'String'},
        {name:'twitter_id',     type:'String'},
        {name:'featured',       type:'Boolean'},
        {name:'announcement',   type:'String'},
        {name:'active',         type:'Boolean'},
        {name:'location',       type:'Object'},
        {name:'coords',         type:'Array'},
        {name:'test',           type:'Boolean'},
        {name:'owner_id',       type:'String'}
    ]
}, function(){
    this.prototype.proxy.url = Bozuko.Router.route(this.prototype.proxy.url);
});