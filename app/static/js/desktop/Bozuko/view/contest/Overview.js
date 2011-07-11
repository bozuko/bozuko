Ext.define('Bozuko.view.contest.Overview',{
    
    extend : 'Ext.panel.Panel',
    
    initComponent : function(){
        var me = this;
        
        Ext.apply(me, {
            tpl : new Ext.XTemplate(
                '<div class="stat-block stat-block-entries">',
                    '<h3>Entries</h3>',
                    '<div class="stat-info">',
                        '<span class="current">{entries_current}</span>',
                        '<span class="total">of {entries_total}</span>',
                    '</div>',
                '</div>',
                '<div class="stat-block stat-block-plays">',
                    '<h3>Plays</h3>',
                    '<div class="stat-info">',
                        '<span class="current">{plays_current}</span>',
                        '<span class="total">of {plays_total}</span>',
                    '</div>',
                '</div>',
                '<div class="stat-block stat-block-prizes">',
                    '<h3>Prizes</h3>',
                    '<div class="stat-info">',
                        '<span class="current">{prizes_current}</span>',
                        '<span class="total">of {prizes_total}</span>',
                    '</div>',
                '</div>'
            )
        });
        
        me.callParent( arguments );
    }
    
});