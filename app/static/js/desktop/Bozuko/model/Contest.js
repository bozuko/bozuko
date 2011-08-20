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
        {name:'engine_mode',        type:'String',              defaultValue:'odds'},
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
    
    getEntryConfig : function(create){
        var me = this,
            cfg = me.get('entry_config');
            
        if( !cfg || !cfg.length){
            if( !create ) return false;
            me.set('entry_config',[{}]);
            cfg = me.get('entry_config');
        }
        return cfg[0];
    },
    
    getEntryType : function(plays){
        var me = this,
            type;
        var cfg = me.get('entry_config');
        if( cfg && cfg.length) cfg = cfg[0];
        else cfg = {};
        try{
            switch( cfg.type ){
                
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
                    try{
                        if( cfg.options.enable_like){
                            type = 'Facebook Checkin w/ Like Bonus';
                        }
                        else{
                            throw '';
                        }
                    }catch(e){
                        type = 'Facebook Checkin';
                    }
                    break;
                    
                default:
                    throw '';
                
            }
        }catch(e){
            type = 'Unknown';
        }
        if( plays !== false ){
            var tokens = cfg.tokens || 0 ;
            return type + ' ('+tokens+' plays)';
        }
        return type;
    },
    
    getGameName : function(){
        switch( this.get('game') ){
            case 'slots':
                return 'Slot Machine';
            case 'scratch':
                return 'Scratch Ticket';
        }
        return '';
    },
    
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
        
        return Math.floor((me.get('token_cursor')) / me.get('entry_config')[0].tokens);
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
    
    getPrizeOdds : function(index){
        var prize = this.prizes().getAt(index),
            prize_total = prize.get('total'),
            total_entries = Number(this.get('total_entries')),
            gcd = this.getGCD(prize_total, total_entries);
        
        return (prize_total/gcd)+' / '+(total_entries/gcd);
    },
    
    getGCD : function(x,y) {
        var w,
            loops = 0;
        while (y != 0 && loops++ < 100 ) {
            w = x % y;
            x = y;
            y = w;
        }
        return x;
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