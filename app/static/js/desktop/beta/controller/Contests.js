Ext.define('Beta.controller.Pages' ,{
    extend: 'Bozuko.lib.app.Controller',
    
    views: [
        
    ],
    stores: [
        
    ],
    
    models: [
        'Bozuko.model.Page'
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
                'itemclick' : me.onContestItemClick
            }
        });
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
        var panel = cmp.up('pagepanel'),
            navbar = panel.down('[ref=page-navbar]'),
            id = record.get('_id');

        if( !panel.reports ) panel.reports = {};
        if( !panel.reports[id] ){
            panel.reports[id] = panel.add({
                border: false,
                record: record,
                xtype: 'contestreportpanel'
            });
        }
        navbar.hide();
        panel.getLayout().setActiveItem(panel.reports[id]);
        panel.doComponentLayout();
    }
});
