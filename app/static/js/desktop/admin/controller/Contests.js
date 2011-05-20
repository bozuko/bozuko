Ext.define('Bozuko.controller.Contests' ,{
    extend: 'Ext.app.Controller',
    
    views: ['contest.Panel', 'contest.edit.Window'],
    stores: ['Contests'],
    
    models: ['Contest', 'Page', 'Prize'],
    
    init : function(){
        this.control({
            'contestpanel contestgrid' : {
                // setup our contest object
                itemdblclick : this.onContestDblClick
            },
            'contestsview' : {
                // setup our contest object
                itemclick : this.onContestItemClick
            },
            'contestform button[action=save]' : {
                click : this.onContestSaveClick
            },
            'contestpanel button[action=create]' : {
                click : this.onCreateContestClick
            },
            'contestpanel button[action=refresh]' : {
                click : this.onRefreshContestsClick
            }
        });
    },
    
    onContestDblClick : function(view, record){
        var panel = view.panel.up('contestpanel'),
            pagePanel = view.panel.up('pagepanel');
        
        // create a new window if necessary
        var id = record.get('_id');
        var window = panel.windows[id];
        if( !window ){
             window = panel.windows[id] = Ext.create('Bozuko.view.contest.edit.Window',{
                title: 'Edit Campaign: ' +(record.get('name')||'Untitled'),
                record: record,
                pageRecord: pagePanel.record,
                contestPanel: panel
            });
        }
        window.show();
        window.focus();
        
    },
    
    onContestSaveClick : function(btn){
        var contestForm = btn.up('contestform'),
            contestWindow = contestForm.up('contesteditwindow'),
            details = contestForm.down('contestformdetails'),
            record = contestForm.record,
            prizes = contestForm.down('contestformprizes');
        
        record.set('page_id', contestWindow.pageRecord.get('_id'));
        record.set( details.getForm().getValues() );
        prizes.updateRecords();
        record.save({
            success : function(){
                record.commit();
                if( record === contestWindow.contestPanel.empty ){
                    // need to add this record to the store and create a new empty record
                    contestPanel.store.add( record );
                    contestWindow.contestPanel.empty = Ext.create('Bozuko.model.Contest');
                }
                contestWindow.setTitle('Edit Campaign: '+record.get('name'));
            },
            callback: function(){
                contestWindow.close();
            }
        });
    },
    
    onCreateContestClick : function(btn){
        var contestPanel = btn.up('contestpanel');
        
        alert('open create window');
    },
    
    onRefreshContestsClick : function(btn){
        var contestPanel = btn.up('contestpanel'),
            contestGrid = contestPanel.down('contestgrid');
        
        contestGrid.store.load();
    },
    
    onContestItemClick : function(view, record, item, index, e){
        // get the target
        var target = e.getTarget();
        if( target.tagName.toLowerCase() != 'a' ) return;
        switch( target.className ){
            case 'edit':
                this.editContest(record, view);
                break;
            
            case 'delete':
                Ext.Msg.confirm(
                    'Are you sure?',
                    'Are you sure you want to delete this campaign?',
                    function(btn){
                        if( btn != 'ok' && btn != 'yes' ) return;
                        // delete it, they said so
                        record.store.remove(record);
                        record.destroy({
                            callback : function(){
                                console.log('the campaign was destroyed');
                            }
                        });
                    }
                );
                break;
                
            case 'publish':
                
            case 'copy':
                Ext.Msg.show({
                    title: 'Not Implemented Yet',
                    msg: 'Working on it... Check back soon',
                    buttons: Ext.MessageBox.OK,
                    icon: Ext.Msg.WARNING
                });
                break;
        }
    },
    
    editContest : function(record, view){
        // create a new
        var panel = view.up('pagepanel'),
            id = record.get('_id');
        
        if( !panel.cards ) panel.cards = {};
        if( !panel.cards[id] ){
            panel.cards[id] = panel.add({
                border: false,
                xtype: 'contestform'
            });
            panel.cards[id].setRecord( record );
            console.log(panel.cards);
        }
        panel.getLayout().setActiveItem(panel.cards[id]);
    }
});