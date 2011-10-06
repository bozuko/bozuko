Ext.define('Bozuko.controller.Contests' ,{
    extend: 'Bozuko.lib.app.Controller',
    
    requires: [
        'Bozuko.lib.app.Controller',
        'Bozuko.view.contest.Reports',
        'Bozuko.view.contest.edit.Form',
        'Bozuko.view.contest.builder.Panel',
        'Bozuko.model.Page'
    ],
    
    views: [
        
    ],
    stores: [
        
    ],
    
    models: [
        
    ],
    
    refs : [
        
    ],
    
    init : function(){
        window.pageController = this;
        var me = this;
        me.control({
            'contestlist' : {
                itemclick       :me.onContestItemClick,
                render          :this.onContestsListRender
            },
            'contestreports button[action=back]' : {
                click           :me.onContestReportsBackButton
            },
            'contestform button[action=save]' : {
                click           :this.onContestSaveClick
            },
            'contestform button[action=back]' : {
                click           :this.onContestBackClick
            },
            'contestbuilder button[action=back]' : {
                click           :this.onContestBuilderBackClick
            },
            'contestform panel[region=west] dataview' : {
                itemclick       :this.onContestNavClick
            },
            'contestspanel button[action=create]' : {
                click           :this.onCreateContestClick
            },
            'contestspanel button[action=builder]' : {
                click           :this.onBuilderButtonClick
            },
            'contestspanel contestbuilder' : {
                apply           :this.onApplyFromBuilder,
                save            :this.onSaveFromBuilder,
                publish         :this.onPublishFromBuilder
            }
        });
    },
    
    onContestsListRender : function(view){
        var me = this;
            
        // get at the store...
        view.store.on('load', function(store){
            me.updateCards(store, view);
        }, this);
    },
    
    onContestReportsBackButton : function(btn){
        var panel = btn.up('contestspanel'),
            contest = panel.getLayout().getActiveItem();
            
        panel.getLayout().setActiveItem( 0 );
        panel.doComponentLayout();
        panel.remove(contest);
    },
    
    onContestBackClick : function(btn){
        var panel = btn.up('contestspanel'),
            active = panel.getLayout().getActiveItem();
        
        panel.getLayout().setActiveItem( 0 );
        panel.doComponentLayout();
        panel.remove( active );
    },
    
    onContestBuilderBackClick : function(btn){
        var builder = btn.up('contestbuilder'),
            panel = btn.up('contestspanel'),
            active = panel.getLayout().getActiveItem();
        
        
        var close = function(){
            panel.getLayout().setActiveItem( 0 );
            panel.doComponentLayout();
            panel.remove( active );
        }
        
        if( builder.contest.get('_id') ){
            // warn about losing changes...
            return close();
        }
        
        return Ext.Msg.show({
            title:'Are you sure?',
            msg: 'If you go back you will lose any changes you made to this contest. Are you sure you would like to continue?',
            buttons: Ext.Msg.YESNO,
            icon: Ext.Msg.QUESTION,
            width: 350,
            modal: true,
            fn : function(id){
                if( id == 'no' ) return;
                close();
            }
        });
    },
    
    onContestSaveClick : function(btn){
        var contestForm = btn.up('contestform'),
            contestsPanel = btn.up('contestspanel'),
            pagePanel = btn.up('pagepanel'),
            contestsView = contestsPanel .down('contestlist'),
            pageRecord = pagePanel.page,
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
                var report;
                if( isNew ){
                    // this isn't really a phantom anymore
                    record.phantom = false;
                    // add it to the store
                    contestsView.store.add(record);
                    // also, lets change the text
                    contestForm.down('[ref=edit-label-text]').setText( 'Edit Campaign:' );
                    contestsPanel.cards[record.get('_id')] = contestForm;
                    record.commit();
                    delete contestsPanel.cards[''];
                }
                contestForm.down('[ref=edit-campaign-text]').setText( record.get('name') );
                // check for reports...
                if( contestsPanel.reports && (report =pagePanel.reports[record.get('_id')]) ){
                    report.down('[ref=report-campaign-text]').setText(record.get('name'));
                }
                prizes.removeAll();
                prizes.updateForms();
            },
            callback: function(){
                pagePanel.successStatus('Contest Saved');
                btn.setText('Save');
                btn.enable();
            }
        });
    },
    
    onContestNavClick : function(view, record){
        var contestform = view.up('contestform');
            cardPanel = contestform.down('panel[region=center]'),
            type = record.get('type'),
            panel = cardPanel.down('[ref='+type+']');

        cardPanel.getLayout().setActiveItem(panel);
    },
    
    onLaunch: function(){
        
    },
    
    onContestItemClick : function(view, record, item, index, e){
        // get the target
        var target = e.getTarget();
        if( target.tagName.toLowerCase() != 'a' ) return;
        switch( target.className ){
            
            case 'edit builder':
                this.openWithBuilder(record, view);
                break;
            
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
                var url = Bozuko.Router.route('/contests/'+record.getId()+'/publish');
                Ext.Msg.confirm(
                    'Are you sure?',
                    'Once the campaign is published, you will not be able to modify it. Are you sure you want to publish this campaign?',
                    function(btn){
                        if( btn != 'ok' && btn != 'yes' ) return;
                        var cp = view.up('contestspanel');
                        cp.setLoading("Publishing... This may take a minute, please be patient");
                        Ext.Ajax.request({
                            url: url,
                            timeout : 1000 * 60 * 5,
                            method: 'post',
                            callback : function(opts, success, response){
                                cp.setLoading(false);
                                if( !success ){
                                    // alert?
                                    alert('Publish request was unreadable');
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
                    }
                );
                break;

            case 'copy':

                var name = record.get('name');
                if( name ) name+=' (Copy)';
                else name = Ext.Date.parse(new Date(), 'Campaign m-d-Y');
                Ext.Msg.prompt({
                    title: 'Copy Campaign',
                    msg: 'What would you like to name your new campaign?',
                    fn: function(btn, text){
                        if( btn !== 'ok') return;
                        var copy = record.copy();
                        copy.phantom=true;

                        // initialize the stores and delete the ids
                        var prizes = copy.prizes();
                        var consolations = copy.consolation_prizes();

                        record.prizes().each(function(prize){
                            var c = prize.copy();
                            c.set('_id','');
                            c.set('won', 0);
                            c.set('redeemed', 0);
                            prizes.add(c);
                        });

                        record.consolation_prizes().each(function(prize){
                            var c = prize.copy();
                            c.set('_id','');
                            c.set('won', 0);
                            c.set('redeemed', 0);
                            consolations.add(c);
                        });

                        var now = new Date();
                            diff = copy.get('end').getTime() - copy.get('start').getTime(),
                            start = now,
                            end = new Date();

                        copy.set('_id', '');
                        end.setTime(start.getTime() + diff);
                        copy.set('start', start);
                        copy.set('end', end);
                        copy.set('name', text);
                        copy.set('active', false);
                        copy.set('total_entries', 0);
                        copy.set('total_plays', 0);
                        copy.set('play_cursor', -1);
                        copy.set('token_cursor', 0);
                        copy.phantom = true;
                        // save the copy
                        copy.save({
                            callback : function(){
                                view.store.load();
                            }
                        });
                    },
                    icon: Ext.Msg.INFO,
                    prompt: true,
                    width: 300,
                    buttons: Ext.Msg.OKCANCEL,
                    value: name,
                    modal: true
                });
                break;

            case 'cancel':

                var url = Bozuko.Router.route('/contests/'+record.getId()+'/cancel');
                 Ext.Msg.confirm(
                    'Are you sure?',
                    'Are you sure you want to cancel this campaign?',
                    function(btn){
                        if( btn != 'ok' && btn != 'yes' ) return;
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
                    }
                );
                
                break;
            
            case 'reports':
                this.openContest( record, view );
                break;
            
            case 'export':
                this.exportContest( record );
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
    
    onBuilderButtonClick : function(btn){
        // create a new
        var panel = btn.up('contestspanel');
        if( !panel.builder ){
            panel.builder = panel.add({
                border: false,
                xtype: 'contestbuilder',
                listeners :{
                    destroy : function(){
                        delete panel.builder;
                    }
                }
            });
        }
        panel.getLayout().setActiveItem(panel.builder);
    },
    
    onCreateContestClick : function(btn){
        var record = new Bozuko.model.Contest();
        this.editContest(record, btn);
    },
    
    editContest : function(record, cmp){
        // create a new
        var panel = cmp.up('contestspanel'),
            id = record.get('_id');

        if( !panel.cards ) panel.cards = {};
        if( !panel.cards[id] ){
            panel.cards[id] = panel.add({
                border: false,
                xtype: 'contestform',
                contest: record,
                listeners :{
                    destroy : function(){
                        delete panel.cards[record.get('_id')];
                    }
                }
            });
            panel.cards[id].setRecord( record );
        }
        panel.getLayout().setActiveItem(panel.cards[id]);
        panel.doComponentLayout();
    },
    
    exportContest : function(record) {
        var data = record.getProxy().getWriter().getRecordData(record);
        // create a new form to submit the data with
        var form = Ext.getBody().createChild({
            tag: 'form',
            action: '/admin/export',
            method: 'post',
            target: 'export',
            style: 'display: none',
            children:[{
                tag: 'input',
                type: 'hidden',
                name: 'body'
            }]
        });
        // no _ids for prizes...
        try {
            Ext.Array.each( data.prizes, function(prize, i){
                delete data.prizes[i]._id;
                delete data.prizes[i].won;
                delete data.prizes[i].redeemed;
            });
            
            Ext.Array.each( data.consolation_prizes, function(prize, i){
                delete data.consolation_prizes[i]._id;
                delete data.prizes[i].won;
                delete data.prizes[i].redeemed;
            });
            
            delete data._id;
            delete data.page_id;
            delete data.play_cursor;
            delete data.token_cursor;
            
            form.down('input').dom.value = Ext.encode(data);
            form.dom.submit();
            form.remove();
        }catch(e){
            alert("Error during export");
        }
        
    },
    
    openWithBuilder : function(record, cmp){
        // create a new
        var panel = cmp.up('contestspanel'),
            id = record.get('_id');

        if( !panel.builders ) panel.builders= {};
        if( !panel.builders[id] ){
            panel.builders[id] = panel.add({
                border: false,
                xtype: 'contestbuilder',
                contest: record,
                review: true,
                listeners : {
                    destroy : function(){
                        delete panel.builders[record.get('_id')];
                    }
                }
            });
        }
        panel.getLayout().setActiveItem(panel.builders[id]);
        panel.doComponentLayout();
    },
    
    onApplyFromBuilder : function(builder, callback){
        this.onSaveFromBuilder(builder, callback, true);
    },
    
    onSaveFromBuilder : function(builder, callback, apply){
        
        var contestsPanel = builder.up('contestspanel'),
            activeBuilder = contestsPanel.getLayout().getActiveItem(),
            pagePanel = contestsPanel.up('pagepanel'),
            btn = builder.down('contestbuildercard{isVisible()} button[ref='+(apply?'apply':'save')+']'),
            contestsView = contestsPanel .down('contestlist'),
            isNew = !!builder.contest.get('_id');
        
        builder.contest.set('page_id', pagePanel.page.get('_id'));
        
        btn.disable();
        btn.setText('Saving...');
        
        setTimeout(function(){
            builder.contest.save({
                success : function(){
                    // close the builder and refresh the list
                    if( !apply ){
                        contestsPanel.getLayout().setActiveItem(0);
                        contestsView.store.load();
                        contestsPanel.remove( activeBuilder );
                    }
                },
                callback: function(){
                    pagePanel.successStatus('Contest Saved');
                    
                    try{
                        btn.setText(apply?'Save':'Save and Close');
                        btn.enable();
                    }catch(e){
                        // btn has been destroyed
                    }
                    
                }
            });
        }, 100);
    },
    
    onPublishFromBuilder : function(builder){
        var contestsPanel = builder.up('contestspanel'),
            activeBuilder = contestsPanel.getLayout().getActiveItem(),
            pagePanel = contestsPanel.up('pagepanel'),
            btn = builder.down('button[ref=save]'),
            contestsView = contestsPanel .down('contestlist'),
            isNew = !!builder.contest.get('_id');
        
        builder.contest.set('page_id', pagePanel.page.get('_id'));
        
        
        Ext.Msg.confirm(
            'Are you sure?',
            'Are you sure you want to publish this campaign?',
            function(answer){
                if( answer != 'ok' && answer != 'yes' ) return;
                btn.disable();
                btn.setText('Saving...');
                builder.contest.save({
                    success : function(){
                        contestsPanel.getLayout().setActiveItem(0);
                        contestsPanel.remove(activeBuilder);
                        
                        var url = Bozuko.Router.route('/contests/'+builder.contest.getId()+'/publish');
                        contestsPanel.setLoading("Publishing... This may take a minute, please be patient");
                        
                        Ext.Ajax.request({
                            url: url,
                            timeout : 1000 * 60 * 5,
                            method: 'post',
                            callback : function(opts, success, response){
                                contestsPanel.setLoading(false);
                                if( !success ){
                                    // alert?
                                    alert('Publish request was unreadable');
                                    return;
                                }
                                try{
                                    var result = Ext.decode( response.responseText );
                                    if( result && result.success){
                                    }
                                }catch(e){
                                    
                                }
                                contestsPanel.down('contestlist').store.load();
                            }
                        });
                    },
                    callback: function(){
                        pagePanel.successStatus('Contest Saved');
                    }
                });
            }
        );
        
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
    },
    
    getValues : function(form, selector){
        var values = {};
        selector = selector ? selector+' field' : 'field';
        Ext.Array.each(form.query( selector ), function(field){
            var name = field.getName();
            var ns = name.split('.'), cur = values;

            if( ns.length > 1 ){
                while( ns.length > 1 ){
                    var p = ns.shift();
                    if( !cur[p]) cur[p] = {};
                    cur = cur[p];
                }
            }
            cur[ns.shift()] = field.getValue();
        });
        return values;
    },
    
    
    updateCards : function(store, view){
        var panel = view.up('contestspanel');
        if( panel.cards ) Ext.Object.each( panel.cards, function(id, card){
            var record;
            if( !(record = store.getById(id)) ){
                panel.remove(card);
            }
            else{
                card.setRecord(record);
            }
        });
        if( panel.reports ) Ext.Object.each( panel.reports, function(id, report){
            var record;
            if( !(record = store.getById(id)) ){
                panel.remove(report);
            }
            else{
                report.setRecord(record);
            }
        });
    }
});
