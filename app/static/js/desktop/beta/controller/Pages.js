Ext.define('Beta.controller.Pages' ,{
    extend: 'Bozuko.lib.app.Controller',
    
    requires : [
        'Bozuko.lib.app.Controller',
        'Bozuko.model.Page'
    ],
    
    views: [
        
    ],
    
    stores: [
        
    ],
    
    refs : [
        {ref: 'pagePanel', selector: 'pagepanel'},
        {ref: 'statusField', selector: '[ref=statusField]'},
        {ref: 'pageSettings', selector: 'pagesettings'},
        {ref: 'updateStatusButton', selector: '[ref=updateStatus]'},
        {ref: 'pagesPanel', selector: '[ref=pages]'}
    ],
    
    init : function(){
        window.pageController = this;
        var me = this;
        me.control({
            'pagepanel' : {
                'render' : me.onPagePanelRender
            },
            '[ref=navigation] button' : {
                'click' : me.changePage
            },
            '[ref=statusField]' : {
                'render' : me.onStatusFieldRender
            },
            'button[ref=updateStatus]' : {
                'click' : me.updateStatus
            },
            'pagesettings [action=save]' : {
                'click' : me.saveSettings
            }
        });
    },
    
    onPagePanelRender : function(pagePanel){
        var me = this,
            page = pagePanel.page,
            btn = pagePanel.down('button[ref=updateStats]'),
            btnText = btn.getText();
        ;
        
        page.on('beforesave', function(){
            btn.setText('Updating Announcement...');
            btn.disable();
        });
        page.on('save', function(){
            btn.setText(btnText);
            btn.enable();
            // update announcement
            me.getStatusField().setValue( page.get('announcement') );
            me.getPageSettings().loadRecord( page );
            me.application.successStatus('Page Saved');
        });
        
        var item = pagePanel.down('[ref=pages]').getLayout().getActiveItem();
        pagePanel.down('[ref=navigation] button[page='+item.ref+']').toggle();
    },
    
    onLaunch: function(){
        var me = this,
            page = me.application.page,
            appView = me.getPagePanel(),
            btn = me.getUpdateStatusButton(),
            btnText = btn.getText();
        ;
        
        page.on('beforesave', function(){
            btn.setText('Updating Announcement...');
            btn.disable();
        });
        page.on('save', function(){
            btn.setText(btnText);
            btn.enable();
            // update announcement
            me.getStatusField().setValue( page.get('announcement') );
            me.getPageSettings().loadRecord( page );
            me.application.successStatus('Page Saved');
        });
        
        var item = appView.down('[ref=pages]').getLayout().getActiveItem();
        appView.down('[ref=navigation] button[page='+item.ref+']').toggle();
        
    },
    
    onStatusFieldRender : function(field){
        var me = this;
        field.setValue( me.application.page.get('announcement') );
    },
    
    updateStatus : function(){
        var me = this,
            page = me.application.page
        ;
        page.set('announcement', me.getStatusField().getValue());
        page.save();
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
    
    changePage : function( btn ){
        var me = this,
            toolbar = btn.up('toolbar')
            ;
        toolbar.items.each(function(cmp){
            if( cmp.xtype == 'button' && cmp.pressed ) cmp.toggle();
        });
        if( !btn.pressed ) btn.toggle();
        
        var panel = me.getPagesPanel(),
            page = panel.down('> [ref='+btn.page+']')
            ;
        
        if( !page ) return;
        if( panel.getLayout().getActiveItem() === page ) return;
        panel.getLayout().setActiveItem( page );
        page.doComponentLayout();
    },
    
    saveSettings : function(saveBtn){
        var me = this,
            form = saveBtn.up('pagesettings'),
            values = this.getValues(form);
            
        form.record.set(values);
        form.record.commit();
        saveBtn.disable();
        form.record.save({
            callback: function(){
                // also double check that we have this
                saveBtn.enable();
            },
            failure: function(){
                alert('Error Saving Page');
            }
        });
    }
});
