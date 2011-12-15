Ext.define('Bozuko.model.Page', {
    extend: 'Bozuko.lib.data.Model',

    idProperty: '_id',

    proxy: {
        type: 'rest',
        url: '/pages',
        reader: {
            type: 'json',
            root: 'items',
            totalProperty: 'total'
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
        {name:'security_img',   type:'String'},
        {name:'services',       type:'Array'},
        {name:'admins',         type:'Array'},
        {name:'has_contests',   type:'Boolean'},
        {name:'pin',            type:'String'}
    ],

    service : function(name){
        var me = this,
            services = this.get('services');

        for(var i=0; i<services.length; i++){
            if( services[i].name == name ) return services[i];
        }
        return false;
    }

}, function(){
    this.prototype.proxy.url = Bozuko.Router.route(this.prototype.proxy.url);
});