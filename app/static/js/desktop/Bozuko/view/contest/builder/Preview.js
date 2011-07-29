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
                    '<tpl if="this.getTimeline()">',
                        '<div class="info-row">',
                            '<div class="label">Timeline</div>',
                            '<div class="value campaign-name">{[this.getTimeline()]}</div>',
                        '</div>',
                    '</tpl>',
                    '<tpl if="this.getEntryMethod()">',
                        '<div class="info-row">',
                            '<div class="label">Entry Method</div>',
                            '<div class="value campaign-name">{[this.getEntryMethod()]}</div>',
                        '</div>',
                    '</tpl>',
                    '<tpl if="this.getGame()">',
                        '<div class="info-row">',
                            '<div class="label">Game</div>',
                            '<div class="value campaign-name">{[this.getGame()]}</div>',
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
                        var cfg = me.contest.getEntryConfig();
                        if( !cfg || cfg.type === '' ) return false;
                        return me.contest.getEntryType(false);
                    },
                    getGame : function(){
                        if( !me.contest.get('game') ) return false;
                        return me.contest.getGameName();
                    }
                }
            )
        });
        
        me.callParent(arguments);
        me.contest.on('modify', function(record){
            me.update(record.raw);
        }, me);
        me.on('render', me.update, me);
    }
    
});