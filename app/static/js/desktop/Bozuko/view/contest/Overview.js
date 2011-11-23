Ext.define('Bozuko.view.contest.Overview',{
    
    alias : 'widget.contestoverview',
    extend : 'Ext.panel.Panel',
    cls : 'contest-overview',
    
    requires : [
        'Ext.XTemplate',
        'Bozuko.lib.PubSub'
    ],
    
    initComponent : function(){
        var me = this;
        
        me.blocks = {};
        me.circles = {};
        me.callbacks = {};
        
        Ext.apply(me, {
            tpl : new Ext.XTemplate(
                
                '<div class="stat-block stat-block-times">',
                    '<div class="circle" style="background-image:url({[this.getCircleUrl("times")]})"></div>',
                    '<div class="info">',
                        '<h3>Day</h3>',
                        '<div class="stat-info">',
                            '<span class="current">{times_current}</span>',
                            '<span class="total">of {times_total}</span>',
                        '</div>',
                    '</div>',
                '</div>',
                '<div class="stat-block stat-block-winners">',
                    '<div class="circle" style="background-image:url({[this.getCircleUrl("winners")]})"></div>',
                    '<div class="info">',
                        '<h3>Won Prizes</h3>',
                        '<div class="stat-info">',
                            '<span class="current">{winners_current}</span>',
                            '<span class="total">of {winners_total}</span>',
                        '</div>',
                    '</div>',
                '</div>',
                '<div class="stat-block stat-block-plays">',
                    '<div class="circle" style="background-image:url({[this.getCircleUrl("plays")]})"></div>',
                    '<div class="info">',
                        '<h3>Plays</h3>',
                        '<div class="stat-info">',
                            '<span class="current">{plays_current}</span>',
                            '<span class="total">of {[plays_total==-1? "&infin;" : plays_total]}</span>',
                        '</div>',
                    '</div>',
                '</div>',
                '<div class="stat-block stat-block-entries">',
                    '<div class="circle" style="background-image:url({[this.getCircleUrl("entries")]})"></div>',
                    '<div class="info">',
                        '<h3>Entries</h3>',
                        '<div class="stat-info">',
                            '<span class="current">{entries_current}</span>',
                            '<span class="total">of {[entries_total==-1 ? "&infin;" : entries_total]}</span>',
                        '</div>',
                    '</div>',
                '</div>',
                
                '<div class="contest-info">',
                    '<div class="info-row">',
                        '<label>Campaign:</label>',
                        '<span>{name}</span>',
                    '</div>',
                    '<div class="info-row">',
                        '<label>Game:</label>',
                        '<span>{game}</span>',
                    '</div>',
                    '<div class="info-row">',
                        '<label>Timeline:</label>',
                        '<span>{timeline}</span>',
                    '</div>',
                    '<div class="info-row">',
                        '<label>Status:</label>',
                        '<span>{state}</span>',
                    '</div>',
                    '<div class="info-row">',
                        '<label>Entry Type:</label>',
                        '<span>{entry_type}</span>',
                    '</div>',
                '</div>',
                {
                    getCircleUrl : function(name){
                        var percent = Math.max( 0, Math.min( 100, Math.round( me.getData()[name+'_percent'] * 100 ) || 0 ) );
                        return Bozuko.Router.route('/s3/public/circles/circle-'+percent+'.png');
                    }
                }
            ),
            data : me.getData()
        });
        
        me.callParent( arguments );
        if( me.record ){
            me.initPubSub();
        }
        me.on('destroy', me.unPubSub, me);
    },
    
    getData : function(){
        var me = this,
            data = {};
        
        if( !me.record ) return data;
        
        data.name = me.record.get('name') || 'Untitled';
        data.game = me.record.get('game');
        data.state = Ext.String.capitalize( me.record.get('state') );
        data.game = Ext.String.capitalize(data.game);
        var game_cfg = me.record.get('game_config');
        if( game_cfg && game_cfg.name ){
            data.game = game_cfg.name+' ('+data.game+')';
        }
        
        data.entry_type = me.record.getEntryType();
        
        data.timeline = Ext.Date.format( me.record.get('start'), 'm/d/Y')+' - '+Ext.Date.format(me.record.get('end'), 'm/d/Y');
        
        data.entries_current = me.record.getEntryCount();
        data.entries_total = me.record.getTotalEntries();
        data.entries_percent = data.entries_total == -1 ? 0 : data.entries_current / data.entries_total;
        
        data.plays_current = me.record.get('play_count');
        data.plays_total = me.record.get('engine_type') == 'time' ? -1 : me.record.get('total_plays');
        data.plays_percent = data.plays_total == -1 ? 0 : data.plays_current / data.plays_total;
        
        data.winners_current = me.record.getWonPrizeCount();
        data.winners_total = me.record.getTotalPrizeCount();
        data.winners_percent = data.winners_current / data.winners_total;
        
        data.redeemed_current = me.record.getRedeemedPrizeCount();
        data.redeemed_total = me.record.getTotalPrizeCount();
        data.redeemed_percent = data.redeemed_current / data.redeemed_total;
        
        var start = new Date(+me.record.get('start')),
            end = new Date(+me.record.get('end')),
            now = new Date();
            
        start.setHours(0);
        start.setMinutes(0);
        start.setSeconds(0);
        start.setMilliseconds(0);
        
        end.setHours(23);
        end.setMinutes(59);
        end.setSeconds(59);
        end.setMilliseconds(999);
        
        var duration = +end-start,
            current = Math.max(0,+now-start),
            HOUR = 1000 * 60 * 60,
            DAY = HOUR * 24,
            total_days = Math.ceil( duration / DAY ),
            total_hours = Math.ceil( duration / HOUR ),
            current_days = Math.ceil( current / DAY ),
            current_hours = Math.ceil( current / HOUR )
            ;
        
        if( current_days > total_days ) current_days = total_days;
        if( current_hours > total_hours ) current_hours = total_days;
        
        data.times_current = current_days;
        data.times_total = total_days;
        data.times_percent = current/duration;
        
        return data;
    },
    
    getCallback : function(name){
        var me = this;
        if( !me.callbacks[name] ){
            me.callbacks[name] = function(){
                me[name].apply(me, arguments);
            };
        }
        return me.callbacks[name];
    },
    
    update : function(record){
        var me = this;
        if( record ){
            if(me.record ) me.unPubSub();
            me.record = record;
            me.initPubSub();
        }
        me.callParent([me.getData()]);
    },
    
    unPubSub : function(){
        var me = this,
            refresh = me.getCallback('refresh');
        Bozuko.PubSub.unsubscribe('contest/win',{contest_id: me.record.get('_id')}, refresh);
        Bozuko.PubSub.unsubscribe('contest/play',{contest_id: me.record.get('_id')}, refresh);
        Bozuko.PubSub.unsubscribe('contest/entry',{contest_id: me.record.get('_id')}, refresh);
        Bozuko.PubSub.unsubscribe('prize/redeemed',{contest_id: me.record.get('_id')}, refresh);
    },
    
    initPubSub : function(){
        var me = this,
            refresh = me.getCallback('refresh');
            
        Bozuko.PubSub.subscribe('contest/win',{contest_id: me.record.get('_id')}, refresh);
        Bozuko.PubSub.subscribe('contest/play',{contest_id: me.record.get('_id')}, refresh);
        Bozuko.PubSub.subscribe('contest/entry',{contest_id: me.record.get('_id')}, refresh);
        Bozuko.PubSub.subscribe('prize/redeemed',{contest_id: me.record.get('_id')}, refresh);
    },
    
    refresh : function(item, callback){
        var me = this;
        if( callback ) callback();
        try{
            if( me.isLoading ){
                me.loadAgain = true;
                return;
            }
            me.record.load({
                scope : me,
                success : function(){
                    me.update();
                },
                callback : function(){
                    me.isLoading = false;
                    if( me.loadAgain ){
                        me.loadAgain = false;
                        me.refresh(item);
                    }
                }
            });
        }catch(e){
            console.log(e);
        }
    }
    
});