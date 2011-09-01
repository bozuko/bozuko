Ext.define( 'Bozuko.view.contest.builder.Preview', {
    
    extend          :'Ext.panel.Panel',
    alias           :'widget.contestbuilderpreview',
    
    initComponent   :function(){
        var me = this;
        
        Ext.apply( me, {
            border          :false,
            tpl             : new Ext.XTemplate(
                '<div class="contest-preview">',
                    '<h3>Your Campaign</h3>',
                    '<tpl if="this.noInfo()">',
                        '<p>A campaign preview will update here as you complete each step.</p>',
                    '</tpl>',
                    '<tpl if="!this.noInfo()">',
                        '<div class="info-row">',
                            '<div class="label">Campaign Name</div>',
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
                            '<div class="label">Contest Odds</div>',
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
                        if( builder.down('[ref=steps]').items.getAt(i).isDisabled() ) return '';
                        
                        var cfg = me.contest.getEntryConfig();
                        if( !cfg || cfg.type === '') return false;
                        return me.contest.getEntryType(false);
                    },
                    getGame : function(){
                        
                        var builder = me.up('contestbuilder');
                        var i = builder.down('[region=center]').items.indexOf(builder.down('contestbuildergame'));
                        if( builder.down('[ref=steps]').items.getAt(i).isDisabled() ) return '';
                        
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
                        if( builder.down('[ref=steps]').items.getAt(i).isDisabled() ) return '';
                        
                        return [
                            '1 in '+me.contest.get('win_frequency').toFixed(1)+' entries will win',
                            '<br />',
                            me.contest.get('total_entries')+' Total Entries'
                        ].join('')
                    }
                }
            )
        });
        
        me.callParent(arguments);
        me.contest.on('modify', me.onContestModify, me);
        me.on('destroy', function(){
            me.contest.un('modify', me.onContestModify, me);
        });
        me.on('render', me.update, me);
    },
    
    onContestModify : function(record){
        var me = this;
        me.update(record ? record.raw : me.contest.raw);
    }
    
});