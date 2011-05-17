Ext.define('Bozuko.controller.Contests' ,{
    extend: 'Ext.app.Controller',
    
    views: ['contest.Panel'],
    stores: ['Contests'],
    
    models: ['Contest', 'Page', 'Prize'],
    
    init : function(){
        this.control({
            'contestpanel contestgrid' : {
                // setup our contest object
                itemclick : this.onContestClick
            },
            'contestform button[action=save]' : {
                click : this.onContestSaveClick
            },
            'contestpanel button[action=create]' : {
                click : this.onCreateContestClick
            }
        });
    },
    
    onContestClick : function(view, record){
        var panel = view.panel.up('contestpanel'),
            form = panel.down('contestform');
        
        form.setRecord( record );
    },
    
    onContestSaveClick : function(btn){
        var contestForm = btn.up('contestform'),
            contestPanel = contestForm.up('contestpanel'),
            pagePanel = contestPanel.up('pagepanel'),
            details = contestForm.down('contestformdetails');
            
        if( !contestForm.record ){
            // no record to save...
            return;
        }
        
        var record = contestForm.record,
            prizes = contestForm.down('contestformprizes');
        
        record.set('page_id', pagePanel.record.get('_id'));
        record.set( details.getForm().getValues() );
        prizes.updateRecords();
        record.save({
            success : function(){
                record.commit();
                if( record === contestPanel.empty ){
                    // need to add this record to the store and create a new empty record
                    contestPanel.store.add( record );
                    contestPanel.empty = Ext.create('Bozuko.model.Contest');
                }
            }
        });
        
    },
    
    onCreateContestClick : function(btn){
        var contestPanel = btn.up('contestpanel'),
            contestForm = contestPanel.down('contestform');
        
        if( !contestPanel.empty ){
            contestPanel.empty = Ext.create('Bozuko.model.Contest');
        }
        
        contestForm.setRecord( contestPanel.empty );
    }
});