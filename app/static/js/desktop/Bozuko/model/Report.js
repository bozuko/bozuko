Ext.define('Bozuko.model.Report', {
    extend: 'Ext.data.Model',
    
    idProperty: '_id',
    
    proxy: {
        type: 'rest',
        url: '/report',
        reader: {
            type: 'json',
            root: 'items'
        }
    },
    
    fields: [
        {name:'_id',               type:'String'},
        {name:'contest_id',        type:'String'},
        {name:'page_id',           type:'String'},
        {name:'timestamp',         type:'Date',        dateFormat:'c'},
        {name:'entries',           type:'auto'},
        {name:'plays',             type:'auto'},  
        {name:'wins',              type:'auto'},  
        {name:'redemptions',       type:'auto'},  
        {name:'win_cost',          type:'auto'},  
        {name:'redemption_cost',   type:'auto'},  
        {name:'fb_posts',          type:'auto'},  
        {name:'fb_likes',          type:'auto'},
        {name:'fb_checkins',       type:'auto'},  
        {name:'unique_users',      type:'auto'},  
        {name:'new_users',         type:'auto'}  
    ]
}, function(){
    this.prototype.proxy.url = Bozuko.Router.route(this.prototype.proxy.url);
});
