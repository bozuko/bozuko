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
            'contestpanel' : {
                render : this.onContestPanelRender
            },
            'contestform button[action=save]' : {
                click : this.onContestSaveClick
            },
            'contestform button[action=back]' : {
                click : this.onContestBackClick
            },
            'contestform panel[region=west] dataview' : {
                itemclick : this.onContestNavClick
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
    
    onContestBackClick : function(btn){
        var pagePanel = btn.up('pagepanel'),
            contestPanel = pagePanel.down('contestpanel'),
            navbar = pagePanel.down('[ref=page-navbar]');
        
        navbar.show();
        pagePanel.getLayout().setActiveItem( contestPanel );
        pagePanel.doLayout();
    },
    
    getValues : function(form, selector){
        var values = {};
        selector = selector ? selector+' field' : 'field';
        Ext.Array.each(form.query( selector ), function(field){
            var ns = field.getName().split('.'), cur = values;
            
            if( ns.length > 1 ) while( ns.length > 1 ){
                var p = ns.shift();
                if( !cur[p]) cur[p] = {};
                cur = cur[p];
            }
            
            cur[ns.shift()] = field.getValue();
        });
        return values;
    },
    
    onContestSaveClick : function(btn){
        var contestForm = btn.up('contestform'),
            pagePanel = btn.up('pagepanel'),
            contestsView = pagePanel.down('contestsview'),
            pageRecord = pagePanel.record,
            record = contestForm.record,
            details = contestForm.down('contestformdetails'),
            prizes = contestForm.down('contestformprizes'),
            consolation_prizes = contestForm.down('contestformconsolationprizes'),
            entry = contestForm.down('contestformentry'),
            rules = contestForm.down('contestformrules'),
            game = contestForm.down('contestformgame');
        
        var isNew = !record.get('_id');
        btn.disable();
        btn.setText( isNew ? 'Creating...' : 'Saving...');
        record.set('page_id', pageRecord.get('_id'));
        record.set( this.getValues(details) );
        record.set( this.getValues(game) );
        record.set( this.getValues(rules) );
        var entry_config = record.get('entry_config');
        if( entry_config && entry_config.length ){
            var values = this.getValues(entry);
            entry_config = Ext.Object.merge( entry_config[0], values );
        }
        else{
            entry_config = this.getValues(entry);
        }
        record.set( 'entry_config', [entry_config] );
        
        var consolation_config = record.get('consolation_config');
        if( consolation_config && consolation_config.length ){
            var values = this.getValues(consolation_prizes, 'fieldset');
            consolation_config = Ext.Object.merge( consolation_config[0], values );
        }
        else{
            consolation_config = this.getValues(consolation_prizes, 'fieldset');
        }
        record.set('consolation_config', [consolation_config]);
        
        prizes.updateRecords();
        consolation_prizes.updateRecords();
        
        record.save({
            success : function(){
                if( isNew ){
                    // add it to the store
                    contestsView.store.add(record);
                    // also, lets change the text
                    contestForm.down('[ref=edit-campaign-text]').setText( record.get('name') );
                    contestForm.down('[ref=edit-label-text]').setText( 'Edit Campaign:' );
                    pagePanel.cards[record.get('_id')] = contestForm;
                    delete pagePanel.cards[''];
                }
                record.commit();
                prizes.removeAll();
                prizes.updateForms();
            },
            callback: function(){
                btn.setText('Save');
                btn.enable();
            }
        });
    },
    
    onContestPanelRender : function(panel){
        panel.store.on('update', function(store, record, op){
            if( op !== Ext.data.Model.COMMIT ) return;
            var pagePanel = panel.up('pagepanel');
            var id = record.getId();
            if( !pagePanel.cards || !pagePanel.cards[id] ) return;
            pagePanel.cards[id].down('[ref=edit-campaign-text]').setText( record.get('name') );
        });
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
                                // console.log('the campaign was destroyed');
                            }
                        });
                    }
                );
                break;
                
            case 'publish':
                var url = '/admin/contests/'+record.getId()+'/publish';
                Ext.Ajax.request({
                    url: url,
                    method: 'post',
                    callback : function(opts, success, response){
                        if( !success ){
                            // alert?
                            return;
                        }
                        try{
                            var result = Ext.decode( response.responseText );
                            if( result && result.success){
                                // need to refresh the contests..
                                view.store.load();
                            }
                        }catch(e){
                            
                        }
                    }
                });
                break;
                
            case 'copy':
            case 'cancel':
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
    
    onContestNavClick : function(view, record){
        var contestform = view.up('contestform');
            cardPanel = contestform.down('panel[region=center]'),
            type = record.get('type'),
            panel = cardPanel.down('[ref='+type+']');
            
        cardPanel.getLayout().setActiveItem(panel);
    },
    
    onCreateContestClick : function(btn){
        var record = new Bozuko.model.Contest();
        this.editContest(record, btn);
    },
    
    editContest : function(record, cmp){
        // create a new
        var panel = cmp.up('pagepanel'),
            navbar = panel.down('[ref=page-navbar]'),
            id = record.get('_id');
        
        if( !panel.cards ) panel.cards = {};
        if( !panel.cards[id] ){
            panel.cards[id] = panel.add({
                border: false,
                xtype: 'contestform'
            });
            panel.cards[id].setRecord( record );
        }
        navbar.hide();
        
        panel.getLayout().setActiveItem(panel.cards[id]);
        panel.doLayout();
        
    }
});