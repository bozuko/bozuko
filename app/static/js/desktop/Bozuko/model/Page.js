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
        {name:'alias',          type:'String'},
        {name:'is_enterprise',  type:'Boolean'},
        {name:'category',       type:'String'},
        {name:'website',        type:'String'},
        {name:'image',          type:'String'},
        {name:'twitter_id',     type:'String'},
        {name:'featured',       type:'Boolean'},
        {name:'nobranding',     type:'Boolean', default: true},
        {name:'announcement',   type:'String'},
        {name:'active',         type:'Boolean'},
        {name:'location',       type:'Object'},
        {name:'coords',         type:'Array'},
        {name:'test',           type:'Boolean'},
        {name:'security_img',   type:'String'},
        {name:'services',       type:'Array'},
        {name:'admins',         type:'Array'},
        {name:'has_contests',   type:'Boolean'},
        {name:'pin',            type:'String'},
        {name:'api_key',        type:'String'},
        {name:'mailchimp_token',type:'String'},
        {name:'mailchimp_dc',   type:'String'},
        {name:'mailchimp_endpoint', type:'String'},
        {name:'mailchimp_lists',    type:'Array'},
        {name:'mailchimp_activelists',    type:'Array'},
        
        {name:'constantcontact_token', type:'String'},
        {name:'constantcontact_username', type:'String'},
        {name:'constantcontact_lists', type:'Array'},
        {name:'constantcontact_activelists', type:'Array'},
        
        {name:'smtp_enabled',   type:'Boolean'},
        {name:'smtp_host',      type:'String'},
        {name:'smtp_port',      type:'Number'},
        {name:'smtp_ssl',       type:'Boolean'},
        {name:'smtp_use_authentication',    type:'Boolean'},
        {name:'smtp_user',      type:'String'},
        {name:'smtp_pass',      type:'String'},
        {name:'smtp_email',     type:'String'},
        {name:'smtp_from_name', type:'String'}
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