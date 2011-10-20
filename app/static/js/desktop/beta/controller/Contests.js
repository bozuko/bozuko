Ext.define('Beta.controller.Contests' ,{
    extend: 'Bozuko.lib.app.Controller',
    
    requires: [
        'Bozuko.lib.app.Controller',
        'Bozuko.view.contest.Reports',
        'Bozuko.model.Page'
    ],
    
    views: [
        
    ],
    stores: [
        
    ],
    
    refs : [
        {ref: 'appView', selector: 'betaapp'},
        {ref: 'contestsPanel', selector: 'contestspanel'}
    ],
    
    init : function(){
        window.pageController = this;
        var me = this;
        me.control({
            'contestlist' : {
                'itemclick'     :me.onContestItemClick
            },
            'contestreports button[action=back]' : {
                'click'         :me.onContestReportsBackButton
            }
        });
    },
    
    onContestReportsBackButton : function(btn){
        var panel = btn.up('contestspanel');
        var contest = panel.getLayout().getActiveItem();
        panel.getLayout().setActiveItem( 0 );
        panel.doComponentLayout();
        panel.remove(contest);
    },
    
    onLaunch: function(){
        
    },
    
    onContestItemClick : function(view, record, item, index, e){
        // get the target
        var target = e.getTarget();
        if( target.tagName.toLowerCase() != 'a' ) return;
        switch( target.className ){
            
            case 'reports':
                this.openContest( record, view );
                break;

            default:
                Ext.Msg.show({
                    title: 'Not Implemented Yet',
                    msg: 'Working on it... Check back soon',
                    buttons: Ext.MessageBox.OK,
                    icon: Ext.Msg.WARNING
                });
                break;
        }
    },
    
    openContest : function(record, cmp){
        // create a new
        var panel = cmp.up('contestspanel'),
            id = record.get('_id');

        if( !panel.reports ) panel.reports = {};
        if( !panel.reports[id] ){
            panel.reports[id] = panel.add({
                border: false,
                record: record,
                xtype: 'contestreports',
                listeners: {
                    destroy : function(){
                        delete panel.reports[id];
                    }
                }
            });
        }
        panel.getLayout().setActiveItem(panel.reports[id]);
        panel.doComponentLayout();
    }
});
