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
            circleRadius: 40,
            trackOver: true,
            itemSelector: '.contest-overview',
            overItemCls : 'contest-overview-over',
            itemCls : 'contest-overview',
            itemTpl : new Ext.XTemplate(
                '<div class="contest-state contest-state-{state}">',
                    '<h3 class="contest-name">{name}</h3>',
                    '<div class="contest-info">',
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
                        '<div class="info-row">',
                            '<label>Prizes:</label>',
                            '<span>{prizes}</span>',
                        '</div>',
                        '<div class="info-row">',
                            '<label>Entry Type:</label>',
                            '<span>{entry_type}</span>',
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
                        '<tpl if="this.canEdit(values) && this.canUseBuilder()">',
                            '<li><a href="javascript:;" class="edit builder">Open with Builder</a></li>',
                        '</tpl>',
                        '<tpl if="this.canCopy(values)">',
                            '<li><a href="javascript:;" class="copy">Copy</a></li>',
                        '</tpl>',
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
                '</div>',
                {
                    
                    canEdit : function(values){
                        if( me.actionButtons && !~me.actionButtons.indexOf('edit')) return '';
                        return true || ~['draft', 'published'].indexOf(values.state);
                    },
                    
                    canUseBuilder : function(){
                        return window.location.port === '8001';
                    },
                    
                    canCopy : function(values){
                        if( me.actionButtons && !~me.actionButtons.indexOf('copy')) return '';
                        return true;
                    },
                    
                    canPublish : function(values){
                        if( me.actionButtons && !~me.actionButtons.indexOf('publish')) return '';
                        return ~['draft'].indexOf(values.state);
                    },
                    
                    canDelete : function(values){
                        if( me.actionButtons && !~me.actionButtons.indexOf('delete')) return '';
                        return ~['draft','published'].indexOf(values.state);
                    },
                    
                    canCancel : function(values){
                        if( me.actionButtons && !~me.actionButtons.indexOf('cancel')) return '';
                        return ~['active'].indexOf(values.state);
                    },
                    
                    canReport : function(values){
                        if( me.actionButtons && !~me.actionButtons.indexOf('report')) return '';
                        return ~['active','complete','cancelled'].indexOf(values.state);
                    }
                }
            ),
            
            listeners : {
                scope : me,
                refresh : me.onRefresh,
                itemupdate : me.onItemUpdate,
                itemadd : me.onItemUpdate
            }
        });
        
        me.callParent(arguments);
    },
    
    onRefresh : function(){
        var me = this;
        if( !me.rendered ) return;
        me.store.each(function(record, index){
            me.addCircles( index, record );
        });
        me.initPubSub();
    },
    
    onItemUpdate : function(record, index){
        var me = this;
        if( !me.rendered ) return;
        if( Ext.isArray(record) ){
            Ext.Array.each( record, function(record){
                index = me.store.indexOf(record);
                me.onItemUpdate(record, index);
            });
            return;
        }
        me.addCircles( index, record );
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
    
    findAndUpdate : function(item, callback){
        
        var me = this,
            record = me.store.getById(item.message.contest_id);
            
        if( callback ) callback();
            
        if( !record ) return;
        
        if( me.isLoading ){
            me.loadAgain = true;
            return;
        }
        me.isLoading = true;
        record.load( function(){
            me.isLoading = false;
            if( me.loadAgain ){
                me.loadAgain = false;
                me.findAndUpdate(item);
            }
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
        
        data.entry_type = record.getEntryType();
        
        data.prizes = record.getPrizeCount()+' ('+record.getTotalPrizeCount()+', $'+record.getTotalPrizesValue()+' total retail value)';
        
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
        
        var start = new Date(+record.get('start')),
            end = new Date(+record.get('end')),
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
            
        if( current_days > total_days ) current_days = total_days;
        if( current_hours > total_hours ) current_hours = total_days;
        
        data.times_current = current_days;
        data.times_total = total_days;
        data.times_percent = current/duration;
        
        return data;
    },
    
    addCircles : function(index, record){
        var me = this;
        if( !me.rendered ) return;
        var el = me.getNode(index),
            radius = me.circleRadius || 40,
            diameter = radius * 2;
        Ext.each(['entries','plays','winners','times'],function(name){
            var block = Ext.fly(el).down('.stat-block-'+name);
            var canvas = block.createChild({
                tag: 'canvas',
                cls: 'circle',
                width: diameter,
                height: diameter
            });
            if( !canvas.dom.getContext ) return;
            var percent = me.getData(record)[name+'_percent'],
                ctx = canvas.dom.getContext('2d');
            ctx.beginPath();
            ctx.fillStyle = '#ffffff';
            ctx.moveTo(radius,radius);
            ctx.arc(radius,radius,radius,Math.PI * (-0.5 + 2 * 0), Math.PI * (-0.5 + 2 * 1), false);
            ctx.moveTo(radius,radius);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.fillStyle = me.rgb(percent);
            ctx.moveTo(radius,radius);
            ctx.arc(radius,radius,radius,Math.PI * (-0.5 + 2 * 0), Math.PI * (-0.5 + 2 * percent), false);
            ctx.moveTo(radius,radius);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.strokeStyle = '#e0e0e0';
            ctx.arc(radius,radius,radius,0,Math.PI*2, false);
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