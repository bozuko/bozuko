Ext.define('Bozuko.view.contest.Overview',{
    
    alias : 'widget.contestoverview',
    extend : 'Ext.panel.Panel',
    cls : 'contest-overview',
    
    initComponent : function(){
        var me = this;
        
        me.blocks = {};
        me.circles = {};
        
        Ext.apply(me, {
            tpl : new Ext.XTemplate(
                '<div class="stat-blocks">',
                    '<div class="stat-block stat-block-entries">',
                        '<div class="info">',
                            '<h3>Entries</h3>',
                            '<div class="stat-info">',
                                '<span class="current">{entries_current}</span>',
                                '<span class="total">of {entries_total}</span>',
                            '</div>',
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
                    '<div class="stat-block stat-block-plays">',
                        '<div class="info">',
                            '<h3>Plays</h3>',
                            '<div class="stat-info">',
                                '<span class="current">{plays_current}</span>',
                                '<span class="total">of {plays_total}</span>',
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
                '</div>'
            ),
            data : me.getData()
        });
        
        me.callParent( arguments );
    },
    
    afterRender : function(){
        var me = this;
        
        me.callParent( arguments );
        
        Ext.each(['entries','plays','winners','times'],function(name){
            me.blocks[name] = me.getEl().down('.stat-block-'+name);
            var canvas = me.circles[name] = me.blocks[name].createChild({
                tag: 'canvas',
                cls: 'circle',
                width: 80,
                height: 80
            });
            if( !canvas.dom.getContext ) return;
            var percent = me.getData()[name+'_percent'],
                ctx = canvas.dom.getContext('2d');
            ctx.beginPath();
            ctx.fillStyle = '#ffffff';
            ctx.moveTo(40,40);
            ctx.arc(40,40,40,Math.PI * (-0.5 + 2 * 0), Math.PI * (-0.5 + 2 * 1), false);
            ctx.moveTo(40,40);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.fillStyle = '#1db153';
            ctx.moveTo(40,40);
            ctx.arc(40,40,40,Math.PI * (-0.5 + 2 * 0), Math.PI * (-0.5 + 2 * percent), false);
            ctx.moveTo(40,40);
            ctx.closePath();
            ctx.fill();
        });
        
        var data = me.getData();
        
    },
    
    getData : function(){
        var me = this,
            data = {};
        
        if( !me.record ) return data;
        
        data.entries_current = me.record.getEntryCount();
        data.entries_total = me.record.getTotalEntries();
        data.entries_percent = data.entries_current / data.entries_total;
        
        data.plays_current = me.record.get('play_cursor')+1;
        data.plays_total = me.record.get('total_plays');
        data.plays_percent = data.plays_current / data.plays_total;
        
        data.winners_current = me.record.getWonPrizeCount();
        data.winners_total = me.record.getTotalPrizeCount();
        data.winners_percent = data.winners_current / data.winners_total;
        
        data.redeemed_current = me.record.getRedeemedPrizeCount();
        data.redeemed_total = me.record.getTotalPrizeCount();
        data.redeemed_percent = data.redeemed_current / data.redeemed_total;
        
        var start = me.record.get('start'),
            end = me.record.get('end'),
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
    
    update : function(record){
        this.record = record;
        this.callParent([this.getData()]);
    }
    
});