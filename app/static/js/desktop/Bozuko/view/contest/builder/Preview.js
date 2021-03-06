Ext.define( 'Bozuko.view.contest.builder.Preview', {
    
    extend          :'Ext.panel.Panel',
    alias           :'widget.contestbuilderpreview',
    
    layout          :'fit',
    
    initComponent   :function(){
        var me = this;
        
        Ext.apply( me, {
            border          :false,
            tpl             : new Ext.XTemplate(
                '<div class="contest-preview">',
                    '<h3>Your Game</h3>',
                    '<tpl if="this.noInfo()">',
                        '<p>A preview of your game will update here as you complete each step.</p>',
                    '</tpl>',
                    '<tpl if="!this.noInfo()">',
                        '<div class="info-row">',
                            '<div class="label">Reference Name</div>',
                            '<div class="value campaign-name">{[this.getTitle()]}</div>',
                        '</div>',
                    '</tpl>',
                    '<tpl if="!this.noInfo() && this.getTimeline()">',
                        '<div class="info-row">',
                            '<div class="label">Timeline</div>',
                            '<div class="value">{[this.getTimeline()]}</div>',
                        '</div>',
                    '</tpl>',
                    '<tpl if="this.getEntryMethod()">',
                        '<div class="info-row">',
                            '<div class="label">Entry Method</div>',
                            '<div class="value">{[this.getEntryMethod()]}</div>',
                        '</div>',
                    '</tpl>',
                    '<tpl if="this.getGame()">',
                        '<div class="info-row">',
                            '<div class="label">Game</div>',
                            '<div class="value">{[this.getGame()]}</div>',
                        '</div>',
                    '</tpl>',
                    '<tpl if="this.getPrizes()">',
                        '<div class="info-row">',
                            '<div class="label">Prizes</div>',
                            '<div class="value">{[this.getPrizes()]}</div>',
                        '</div>',
                    '</tpl>',
                    '<tpl if="this.getOdds()">',
                        '<div class="info-row">',
                            '<div class="label">Prize Serving</div>',
                            '<div class="value">{[this.getOdds()]}</div>',
                        '</div>',
                    '</tpl>',
                '</div>',
                /* Template member functions */
                {
                    noInfo : function(){
                        return !me.contest.get('name');
                    },
                    getTitle : function(){
                        return me.contest.get('name');
                    },
                    getTimeline : function(){
                        var start = me.contest.get('start');
                        var end = me.contest.get('end');
                        if( !start || !end ) return false;
                        return Ext.Date.format(start, 'm/d/Y')+' - '+Ext.Date.format(end, 'm/d/Y')
                    },
                    getEntryMethod : function(){
                        
                        var builder = me.up('contestbuilder');
                        var i = builder.down('[region=center]').items.indexOf(builder.down('contestbuilderentry'));
                        if( builder.query('[ref=step-btn]')[i].isDisabled() ) return '';
                        
                        var cfg = me.contest.getEntryConfig();
                        if( !cfg || cfg.type === '') return false;
                        return me.contest.getEntryType(false);
                    },
                    getGame : function(){
                        
                        var builder = me.up('contestbuilder');
                        var i = builder.down('[region=center]').items.indexOf(builder.down('contestbuildergame'));
                        if( builder.query('[ref=step-btn]')[i].isDisabled() ) return '';
                        
                        if( !me.contest.get('game') ) return false;
                        return me.contest.getGameName();
                    },
                    getPrizes : function(){
                        /*
                        var builder = me.up('contestbuilder');
                        var i = builder.down('[region=center]').items.indexOf(builder.down('contestbuildergame'));
                        if( builder.down('[ref=steps]').items.getAt(i).isDisabled() ) return '';
                        */
                        var prizes = me.contest.prizes();
                        if( !prizes.getCount() ) return false;
                        return prizes.getCount()+' Prize Types<br />'+me.contest.getTotalPrizeCount()+' Total Prizes<br />$'+me.contest.getTotalPrizesValue()+' Total Value';
                    },
                    getOdds : function(){
                        
                        var builder = me.up('contestbuilder');
                        var i = builder.down('[region=center]').items.indexOf(builder.down('contestbuilderodds'));
                        if( builder.query('[ref=step-btn]')[i].isDisabled() ) return '';
                        
                        return me.contest.get('engine_type') == 'order' ?
                        [
                            '1 in '+me.contest.get('win_frequency').toFixed(1)+' entries will win',
                            '<br />',
                            me.contest.get('total_entries')+' Total Entries'
                        ].join('') :
                        [
                            'Prizes will distributed over total time period.'
                        ].join('')
                    }
                }
            )
        });
        
        me.callParent(arguments);
        me.contest.on('modify', me.onContestModify, me);
        me.contest.prizes().on('update', me.onContestModify, me);
        me.on('destroy', function(){
            me.contest.un('modify', me.onContestModify, me);
            me.contest.prizes().un('update', me.onContestModify, me);
        });
        me.on('render', me.update, me);
    },
    
    onContestModify : function(){
        var me = this;
        me.update(me.contest.raw);
    }
    
});