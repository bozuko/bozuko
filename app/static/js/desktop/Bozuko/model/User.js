Ext.define('Bozuko.model.User', {
    extend: 'Ext.data.Model',
    
    idProperty: '_id',
    
    proxy: {
        type: 'rest',
        url: '/users',
        reader: {
            type: 'json',
            root: 'items',
            totalProperty: 'total'
        }
    },
    
    fields: [
        {name:'_id',            type:'String'},
        {name:'name',           type:'String'},
        {name:'email',          type:'String'},
        {name:'image',          type:'String'},
        {name:'entry_id',       type:'String'},
        {name:'blocked',        type:'Boolean'},
        {name:'allowed',        type:'Boolean'}
    ]
}, function(){
    this.prototype.proxy.url = Bozuko.Router.route(this.prototype.proxy.url);
});