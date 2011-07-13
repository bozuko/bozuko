Ext.define('Bozuko.view.contest.List' ,{
    
    extend: 'Ext.view.View',
    alias : 'widget.contestlist',
    
    requires : [
        'Bozuko.lib.PubSub'
    ],
    
    emptyText: 'No active campaigns.',
    deferEmptyText: false,
    
    initComponent : function(){
        var me = this;
        me.callbacks = {};
        Ext.apply( me, {
            cls: 'contest-list',
            itemSelector: '.contest-overview',
            itemCls : 'contest-overview',
            itemTpl : new Ext.XTemplate(
                
                '<div class="contest-info">',
                    '<div class="info-row">',
                        '<h3>{name}</h3>',
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
                        '<span>{State}</span>',
                    '</div>',
                '</div>',
                
                '<div class="stat-block stat-block-times">',
                    '<div class="info">',
                        '<h3>Day</h3>',
                        '<div class="stat-info">',
                            '<span class="current">{times_current}</span>',
                            '<span class="total">of {times_total}</span>',
                        '</div>',
                    '</div>',
                '</div>',
                '<div class="stat-block stat-block-winners">',
                    '<div class="info">',
                        '<h3>Won Prizes</h3>',
                        '<div class="stat-info">',
                            '<span class="current">{winners_current}</span>',
                            '<span class="total">of {winners_total}</span>',
                        '</div>',
                    '</div>',
                '</div>',
                '<div class="stat-block stat-block-plays">',
                    '<div class="info">',
                        '<h3>Plays</h3>',
                        '<div class="stat-info">',
                            '<span class="current">{plays_current}</span>',
                            '<span class="total">of {plays_total}</span>',
                        '</div>',
                    '</div>',
                '</div>',
                '<div class="stat-block stat-block-entries">',
                    '<div class="info">',
                        '<h3>Entries</h3>',
                        '<div class="stat-info">',
                            '<span class="current">{entries_current}</span>',
                            '<span class="total">of {entries_total}</span>',
                        '</div>',
                    '</div>',
                '</div>',
                
                '<ul class="app-buttons">',
                    '<tpl if="this.canReport(values)">',
                        '<li><a href="javascript:;" class="reports">Reports</a></li>',
                    '</tpl>',
                    '<tpl if="this.canEdit(values)">',
                        '<li><a href="javascript:;" class="edit">Edit</a></li>',
                    '</tpl>',
                    '<li><a href="javascript:;" class="copy">Copy</a></li>',
                    '<tpl if="this.canPublish(values)">',
                        '<li><a href="javascript:;" class="publish">Publish</a></li>',
                    '</tpl>',
                    '<tpl if="this.canDelete(values)">',
                        '<li><a href="javascript:;" class="delete">Delete</a></li>',
                    '</tpl>',
                    '<tpl if="this.canCancel(values)">',
                        '<li><a href="javascript:;" class="cancel">Cancel</a></li>',
                    '</tpl>',
                '</ul>',
                {
                    
                    canEdit : function(values){
                        return true || ~['draft', 'published'].indexOf(values.state);
                    },
                    
                    canPublish : function(values){
                        return ~['draft'].indexOf(values.state);
                    },
                    
                    canDelete : function(values){
                        return ~['draft','published'].indexOf(values.state);
                    },
                    
                    canCancel : function(values){
                        return ~['active'].indexOf(values.state);
                    },
                    
                    canReport : function(values){
                        return ~['active','complete','cancelled'].indexOf(values.state);
                    }
                }
            ),
            
            listeners : {
                scope : me,
                refresh : me.onRefresh
            }
        });
        
        me.callParent(arguments);
    },
    
    onRefresh : function(){
        var me = this;
        if( !me.rendered ) return;
        me.store.each(function(record, index){
            console.log(record);
            me.addCircles( index, record );
        });
        me.initPubSub();
        
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
    
    findAndUpdate : function(message){
        var me = this,
            record = me.store.getById(message.contest_id);
            
        if( !record ) return;
        record.load( function(){
            me.refresh();
        });
    },
    
    unPubSub : function(){
        var me = this,
            refresh = me.getCallback('findAndUpdate');
        Ext.each( me._pubsubs, function(id){
            Bozuko.PubSub.unsubscribe('contest/win',{contest_id: id}, refresh);
            Bozuko.PubSub.unsubscribe('contest/play',{contest_id: id}, refresh);
            Bozuko.PubSub.unsubscribe('contest/entry',{contest_id: id}, refresh);
            Bozuko.PubSub.unsubscribe('prize/redeemed',{contest_id: id}, refresh);
        });
    },
    
    initPubSub : function(){
        var me = this,
            refresh = me.getCallback('findAndUpdate');
        me.unPubSub();    
        me._pubsubs = [];
        me.store.each(function(record){
            me._pubsubs.push(record.getId());
            Bozuko.PubSub.subscribe('contest/win',{contest_id: record.get('_id')}, refresh);
            Bozuko.PubSub.subscribe('contest/play',{contest_id: record.get('_id')}, refresh);
            Bozuko.PubSub.subscribe('contest/entry',{contest_id: record.get('_id')}, refresh);
            Bozuko.PubSub.subscribe('prize/redeemed',{contest_id: record.get('_id')}, refresh);
        });    
    },
    
    prepareData : function(raw, index, record){
        return this.getData(record);
    },
    
    getData : function(record){
        var me = this,
            data = {};
        
        if( !record ) return data;
        
        data.name = record.get('name') || 'Untitled';
        data.game = record.get('game');
        data.state = record.get('state');
        data.State = Ext.String.capitalize( record.get('state') );
        data.game = Ext.String.capitalize(data.game);
        var game_cfg = record.get('game_config');
        if( game_cfg && game_cfg.name ){
            data.game = game_cfg.name+' ('+data.game+')';
        }
        
        data.timeline = Ext.Date.format( record.get('start'), 'm/d/Y')+' - '+Ext.Date.format(record.get('end'), 'm/d/Y');
        
        data.entries_current = record.getEntryCount();
        data.entries_total = record.getTotalEntries();
        data.entries_percent = data.entries_current / data.entries_total;
        
        data.plays_current = record.get('play_cursor')+1;
        data.plays_total = record.get('total_plays');
        data.plays_percent = data.plays_current / data.plays_total;
        
        data.winners_current = record.getWonPrizeCount();
        data.winners_total = record.getTotalPrizeCount();
        data.winners_percent = data.winners_current / data.winners_total;
        
        data.redeemed_current = record.getRedeemedPrizeCount();
        data.redeemed_total = record.getTotalPrizeCount();
        data.redeemed_percent = data.redeemed_current / data.redeemed_total;
        
        var start = record.get('start'),
            end = record.get('end'),
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
            current = +now-start,
            HOUR = 1000 * 60 * 60,
            DAY = HOUR * 24,
            total_days = Math.ceil( duration / DAY ),
            total_hours = Math.ceil( duration / HOUR ),
            current_days = Math.ceil( current / DAY ),
            current_hours = Math.ceil( current / HOUR )
            ;
        
        data.times_current = current_days;
        data.times_total = total_days;
        data.times_percent = current/duration;
        
        return data;
    },
    
    addCircles : function(index, record){
        var me = this;
        if( !me.rendered ) return;
        var el = me.getNode(index);
        Ext.each(['entries','plays','winners','times'],function(name){
            var block = Ext.fly(el).down('.stat-block-'+name);
            var canvas = block.createChild({
                tag: 'canvas',
                cls: 'circle',
                width: 80,
                height: 80
            });
            if( !canvas.dom.getContext ) return;
            var percent = me.getData(record)[name+'_percent'],
                ctx = canvas.dom.getContext('2d');
            ctx.beginPath();
            ctx.fillStyle = '#ffffff';
            ctx.moveTo(40,40);
            ctx.arc(40,40,40,Math.PI * (-0.5 + 2 * 0), Math.PI * (-0.5 + 2 * 1), false);
            ctx.moveTo(40,40);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.fillStyle = me.rgb(percent);
            ctx.moveTo(40,40);
            ctx.arc(40,40,40,Math.PI * (-0.5 + 2 * 0), Math.PI * (-0.5 + 2 * percent), false);
            ctx.moveTo(40,40);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.strokeStyle = '#e0e0e0';
            ctx.arc(40,40,40,0,Math.PI*2, false);
            ctx.closePath();
            ctx.stroke();
        });
    },
    
    rgb : function(percent){
        var r,g,b;
        if( percent < .25 ){
            r=29,g=177,b=53;
        }
        else if( percent < .50 ){
            r=227,g=244,b=31;
        }
        else if( percent < .75 ){
            r=255,g=127,b=0;
        }
        else{
            r=255,g=0,b=0;
        }
        return ['rgba('+r,g,b,'.5)'].join(',');
    }
});