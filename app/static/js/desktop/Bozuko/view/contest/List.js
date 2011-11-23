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
                        '<div class="circle" style="background-image:url({[this.getCircleUrl(xindex,"times")]})"></div>',
                        '<div class="info">',
                            '<h3>Day</h3>',
                            '<div class="stat-info">',
                                '<span class="current">{times_current}</span>',
                                '<span class="total">of {times_total}</span>',
                            '</div>',
                        '</div>',
                    '</div>',
                    '<div class="stat-block stat-block-winners">',
                        '<div class="circle" style="background-image:url({[this.getCircleUrl(xindex,"winners")]})"></div>',
                        '<div class="info">',
                            '<h3>Won Prizes</h3>',
                            '<div class="stat-info">',
                                '<span class="current">{winners_current}</span>',
                                '<span class="total">of {winners_total}</span>',
                            '</div>',
                        '</div>',
                    '</div>',
                    '<div class="stat-block stat-block-plays">',
                        '<div class="circle" style="background-image:url({[this.getCircleUrl(xindex,"plays")]})"></div>',
                        '<div class="info">',
                            '<h3>Plays</h3>',
                            '<div class="stat-info">',
                                '<span class="current">{plays_current}</span>',
                                '<span class="total">of {[plays_total=-1?"&infin;":plays_total]}</span>',
                            '</div>',
                        '</div>',
                    '</div>',
                    '<div class="stat-block stat-block-entries">',
                        '<div class="circle" style="background-image:url({[this.getCircleUrl(xindex,"entries")]})"></div>',
                        '<div class="info">',
                            '<h3>Entries</h3>',
                            '<div class="stat-info">',
                                '<span class="current">{entries_current}</span>',
                                '<span class="total">of {[entries_total=-1?"&infin;":entries_total]}</span>',
                            '</div>',
                        '</div>',
                    '</div>',
                    
                    '<ul class="app-buttons">',
                        '<tpl if="this.canReport(values)">',
                            '<li><a href="/" onclick="return false;" class="reports">Reports</a></li>',
                        '</tpl>',
                        '<tpl if="this.canEdit(values) && this.isAdmin()">',
                            '<li><a href="/" onclick="return false;" class="edit">Edit (Admin)</a></li>',
                        '</tpl>',
                        '<tpl if="this.canEdit(values)">',
                            '<li><a href="/" onclick="return false;" class="edit builder">Open</a></li>',
                        '</tpl>',
                        '<tpl if="this.canCopy(values)">',
                            '<li><a href="/" onclick="return false;" class="copy">Copy</a></li>',
                        '</tpl>',
                        '<tpl if="this.canPublish(values)">',
                            '<li><a href="/" onclick="return false;" class="publish">Publish</a></li>',
                        '</tpl>',
                        '<tpl if="this.canDelete(values)">',
                            '<li><a href="/" onclick="return false;" class="delete">Delete</a></li>',
                        '</tpl>',
                        '<tpl if="this.canCancel(values)">',
                            '<li><a href="/" onclick="return false;" class="cancel">Cancel</a></li>',
                        '</tpl>',
                        '<tpl if="this.isAdmin()">',
                            '<li><a href="/" onclick="return false;" class="export">Export</a></li>',
                        '</tpl>',
                    '</ul>',
                '</div>',
                {
                    
                    getCircleUrl : function(index, name){
                        var record = me.store.getAt(index-1),
                            percent = Math.max( 0, Math.min( 100, Math.round( me.getData(record)[name+'_percent'] * 100 ) || 0 ) );
                            
                        return Bozuko.Router.route('/s3/public/circles/circle-'+percent+'.png');
                    },
                    
                    isAdmin : function(){
                        return window.location.pathname.match(/^\/admin/);
                    },
                    
                    canEdit : function(values){
                        if( me.actionButtons && !~Ext.Array.indexOf(me.actionButtons,'edit')){
                            return false;
                        }
                        return this.isAdmin() || ~Ext.Array.indexOf(['draft', 'published'], values.state);
                    },
                    
                    canUseBuilder : function(){
                        return window.location.hostname.match(/playground/);
                    },
                    
                    canCopy : function(values){
                        if( me.actionButtons && !~Ext.Array.indexOf(me.actionButtons,'copy')) return '';
                        return true;
                    },
                    
                    canPublish : function(values){
                        if( me.actionButtons && !~Ext.Array.indexOf(me.actionButtons,'publish')) return '';
                        return ~Ext.Array.indexOf(['draft'],values.state);
                    },
                    
                    canDelete : function(values){
                        if( me.actionButtons && !~Ext.Array.indexOf(me.actionButtons,'delete')) return '';
                        return ~Ext.Array.indexOf(['draft','published'],values.state);
                    },
                    
                    canCancel : function(values){
                        if( me.actionButtons && !~Ext.Array.indexOf(me.actionButtons,'cancel')) return '';
                        return ~Ext.Array.indexOf(['active'],values.state);
                    },
                    
                    canReport : function(values){
                        if( me.actionButtons && !~Ext.Array.indexOf(me.actionButtons,'report')) return '';
                        return ~Ext.Array.indexOf(['active','complete','cancelled'],values.state);
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
        me.on('destroy', me.unPubSub, me);
    },
    
    onRefresh : function(){
        var me = this;
        if( !me.rendered ) return;
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
        data.entries_percent = data.entries_total == -1 ? 0 : data.entries_current / data.entries_total;
        
        data.plays_current = record.get('play_count');
        data.plays_total = record.get('engine_type') == 'time' ? -1 : record.get('total_plays');
        data.plays_percent = data.plays_total == -1 ? 0 : data.plays_current / data.plays_total;
        
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
    }
});