Ext.define('Bozuko.model.Contest', {
    extend: 'Bozuko.lib.data.Model',
    
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
        {name:'name',               type:'String',              defaultValue:'Untitled Campaign'},
        {name:'win_frequency',      type:'Number',              defaultValue:2},
        {name:'engine_type',        type:'String'},
        {name:'game',               type:'String',              defaultValue:'slots'},
        {name:'game_config',        type:'Object',              defaultValue:{theme:'default'}},
        {name:'auto_rules',         type:'Boolean',             defaultValue:true},
        {name:'rules',              type:'String'},
        {name:'entry_config',       type:'Array',               defaultValue:[{type:'facebook/checkin',tokens:3}]},
        {name:'consolation_config', type:'Array'},
        {name:'free_play_pct',      type:'Number',              defaultValue:'30%'},
        {name:'active',             type:'Boolean'},
        {name:'state',              type:'String'},
        {name:'start',              type:'Date',                defaultValue:new Date()},
        {name:'end',                type:'Date',                defaultValue:Ext.Date.add(new Date(), Ext.Date.DAY, 90)},
        {name:'total_entries',      type:'Number'},
        {name:'total_plays',        type:'Number'},
        {name:'post_to_wall',       type:'Boolean',             defaultValue:true},
        {name:'play_cursor',        type:'Number',              defaultValue:-1},
        {name:'token_cursor',       type:'Number',              defaultValue:0}
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
        try{
            var entry_config = me.get('entry_config')[0];
            if( entry_config.type == 'facebook/checkin' && entry_config.options.enable_like ){
                qty *= 2;
            }
        }catch(e){
            // no big deal, probably didn't have options
            console.log(e);
        }
        
        return qty * me.get('win_frequency');
    },
    
    getEntryCount : function(){
        var me = this;
        
        return Math.floor((me.get('token_cursor')+1) / me.get('entry_config')[0].tokens);
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
    },
    
    getPrizeCount : function(){
        return this.prizes().getCount();
    },
    
    
    getTotalPrizesValue : function(){
        var me = this,
            value = 0;
        me.prizes().each(function(prize){
            value += (prize.get('total')* prize.get('value'));
        });
        return value;
    }
    
    
}, function(){
    this.prototype.proxy.url = Bozuko.Router.route(this.prototype.proxy.url);
});