Ext.define('Bozuko.model.Contest', {
    extend: 'Ext.data.Model',
    
    idProperty: '_id',
    
    requires:[
        'Ext.ux.data.writer.JsonDeep',
        'Bozuko.lib.Router',
        'Bozuko.model.Prize'
    ],
    
    proxy: {
        type: 'rest',
        url: '/contests',
        reader: {
            type: 'json',
            root: 'items'
        },
        writer: {
            type: 'jsondeep'
        }
    },
    
    fields: [
        {name:'_id',                type:'String'},
        {name:'page_id',            type:'String'},
        {name:'name',               type:'String'},
        {name:'win_frequency',      type:'Number'},
        {name:'engine_type',        type:'String'},
        {name:'game',               type:'String'},
        {name:'game_config',        type:'Object'},
        {name:'auto_rules',         type:'String'},
        {name:'rules',              type:'String'},
        {name:'entry_config',       type:'Array'},
        {name:'consolation_config', type:'Array'},
        {name:'free_play_pct',      type:'Number'},
        {name:'active',             type:'Boolean'},
        {name:'state',              type:'String'},
        {name:'start',              type:'Date'},
        {name:'end',                type:'Date'},
        {name:'total_entries',      type:'Number'},
        {name:'total_plays',        type:'Number'},
        {name:'post_to_wall',       type:'Boolean'},
        {name:'play_cursor',        type:'Number',              defaultValue:-1},
        {name:'token_cursor',       type:'Number',              defaultValue:-1}
    ],
    
    hasMany: [
        {model: 'Bozuko.model.Prize', name: 'prizes', associationKey: 'prizes'},
        {model: 'Bozuko.model.Prize', name: 'consolation_prizes', associationKey: 'consolation_prizes'}
    ],
    
    autoLoad: true,
    
    getTotalEntries : function(){
        var me = this,
            qty = 0;
        me.prizes().each(function(prize){
            qty += prize.get('total');
        });
        if( me.entry_config && me.entry_config[0].type == 'facebook/checkin' && me.entry_config[0].enable_like ){
            qty *= 2;
        }
        return qty * me.get('win_frequency');
    },
    
    getEntryCount : function(){
        var me = this;
        
        return (me.get('token_cursor')+1) / me.get('entry_config')[0].tokens;
    },
    
    getWonPrizeCount : function(){
        var me = this,
            qty = 0;
            
        me.prizes().each(function(prize){
            qty+= (prize.get('won') || 0);
        });
        
        return qty;
    },
    
    getTotalPrizeCount : function(){
        var me = this,
            qty = 0;
            
        me.prizes().each(function(prize){
            qty+= prize.get('total');
        });
        
        return qty;
    },
    
    getRedeemedPrizeCount : function(){
        var me = this,
            qty = 0;
            
        me.prizes().each(function(prize){
            qty+= (prize.get('redeemed') || 0);
        });
        
        return qty;
    }
    
    
}, function(){
    this.prototype.proxy.url = Bozuko.Router.route(this.prototype.proxy.url);
});